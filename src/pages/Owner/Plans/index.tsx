import { useState, useEffect, useCallback } from 'react'
import { Check, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/AuthContext'
import { plansService } from '../../../services/plansService'
import { subscriptionService } from '../../../services/subscriptionService'
import DashboardLayout from '../../../components/DashboardLayout'
import { ownerNavItems } from '../../../constants/navItems'
import { formatarPrecoCentavos } from '../../../utils/formatCurrency'
import { mensagemDeErro } from '../../../utils/apiError'
import type { Plan, SubscriptionStatus, SwitchPlanPreview } from '../../../types/api'
import {
  Container, UsageCard, UsageGrid, UsageItem, UsageLabel, UsageValue, UsageBar, UsageBarFill,
  PlansGrid, PlanCard, CurrentBadge, PlanName, PlanPrice, PlanFeatures, PlanButton,
  Modal, ModalOverlay, ModalBox, ModalTitle, EffectRow, WarningBox, ModalActions, CancelBtn, ConfirmBtn,
  CenteredSpinner,
} from './styles'

const STATUS_COM_TROCA = ['active', 'trialing', 'past_due']

function limiteLabel(valor: number | null, feminino = false): string {
  return valor === null ? (feminino ? 'Ilimitadas' : 'Ilimitados') : String(valor)
}

export default function OwnerPlans() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)

  const [trocaPlano, setTrocaPlano] = useState<Plan | null>(null)
  const [preview, setPreview] = useState<SwitchPlanPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const carregar = useCallback(() => {
    setLoading(true)
    return Promise.all([
      plansService.getAll(),
      subscriptionService.getStatus(),
    ]).then(([plansData, subData]) => {
      setPlans(plansData)
      setSub(subData)
    }).catch(() => {
      toast.error('Não foi possível carregar os planos. Tente novamente.')
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    if (!trocaPlano) return
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmando) setTrocaPlano(null)
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [trocaPlano, confirmando])

  const podeTrocar = sub ? STATUS_COM_TROCA.includes(sub.status) && !!sub.stripeSubscriptionId : false

  const handleAssinar = async (planId: string) => {
    try {
      setPaying(planId)
      const { url } = await subscriptionService.createCheckout(planId)
      if (!url) throw new Error('O pagamento não retornou um endereço de checkout.')
      window.location.assign(url)
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao iniciar pagamento. Tente novamente.'))
      setPaying(null)
    }
  }

  const abrirTroca = async (plano: Plan) => {
    setTrocaPlano(plano)
    setPreview(null)
    setPreviewLoading(true)
    try {
      const result = await subscriptionService.previewSwitch(plano.id)
      setPreview(result)
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível calcular o efeito da troca.'))
      setTrocaPlano(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const confirmarTroca = async () => {
    if (!trocaPlano) return
    try {
      setConfirmando(true)
      await subscriptionService.switchPlan(trocaPlano.id)
      toast.success(`Plano trocado para ${trocaPlano.nome}.`)
      setTrocaPlano(null)
      setPreview(null)
      carregar()
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível trocar de plano. Tente novamente.'))
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <DashboardLayout
      user={user}
      navItems={ownerNavItems(user?.role)}
      tagline="Owner Panel"
      accent="#3b82f6"
      pageTitle="Planos"
      pageSub="Compare, assine ou troque de plano."
    >
      <Container>
        {sub?.usage && (
          <UsageCard>
            <h2>Uso atual</h2>
            <UsageGrid>
              <BarraDeUso
                label="Quadras"
                usado={sub.usage.quadras}
                limite={sub.plan?.maxQuadras}
              />
              <BarraDeUso
                label="Estabelecimentos"
                usado={sub.usage.estabelecimentos}
                limite={sub.plan?.maxEstabelecimentos}
              />
            </UsageGrid>
          </UsageCard>
        )}

        {loading ? (
          <CenteredSpinner>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </CenteredSpinner>
        ) : (
          plans.length === 0 ? (
            <CenteredSpinner>Nenhum plano está disponível no momento.</CenteredSpinner>
          ) : <PlansGrid>
            {plans.map((plano) => {
              const éAtual = sub?.plan?.id === plano.id
              const carregandoEsse = paying === plano.id

              return (
                <PlanCard key={plano.id} $current={éAtual}>
                  {éAtual && <CurrentBadge>Seu plano atual</CurrentBadge>}
                  <PlanName>{plano.nome}</PlanName>
                  <PlanPrice>
                    {formatarPrecoCentavos(plano.precoCentavos)}<span> / mês</span>
                  </PlanPrice>
                  <PlanFeatures>
                    <li><Check size={16} /> {limiteLabel(plano.maxQuadras, true)} quadras</li>
                    <li><Check size={16} /> {limiteLabel(plano.maxEstabelecimentos)} estabelecimentos</li>
                    <li><Check size={16} /> {limiteLabel(plano.maxModalidades, true)} modalidades</li>
                  </PlanFeatures>

                  {éAtual ? (
                    <PlanButton $variant="secondary" disabled>Plano atual</PlanButton>
                  ) : podeTrocar ? (
                    <PlanButton onClick={() => abrirTroca(plano)} disabled={previewLoading || confirmando}>
                      Trocar para este plano
                    </PlanButton>
                  ) : (
                    <PlanButton onClick={() => handleAssinar(plano.id)} disabled={carregandoEsse}>
                      {carregandoEsse
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                        : 'Assinar'}
                    </PlanButton>
                  )}
                </PlanCard>
              )
            })}
          </PlansGrid>
        )}
      </Container>

      {trocaPlano && (
        <Modal>
          <ModalOverlay onClick={() => !confirmando && setTrocaPlano(null)} />
          <ModalBox role="dialog" aria-modal="true" aria-labelledby="titulo-troca-plano">
            <ModalTitle id="titulo-troca-plano">Trocar para {trocaPlano.nome}</ModalTitle>

            {previewLoading ? (
              <CenteredSpinner>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </CenteredSpinner>
            ) : preview && (
              <>
                <EffectRow>
                  <span className="label">Quando passa a valer</span>
                  <span className="value">{preview.efetivaImediatamente ? 'Imediatamente' : 'No próximo ciclo'}</span>
                </EffectRow>
                <EffectRow>
                  <span className="label">Cobrança imediata</span>
                  <span className="value">Nenhuma</span>
                </EffectRow>
                <EffectRow>
                  <span className="label">{preview.tipo === 'downgrade'
                    ? 'Crédito estimado na próxima fatura'
                    : preview.tipo === 'upgrade'
                      ? 'Ajuste estimado na próxima fatura'
                      : 'Ajuste na próxima fatura'}</span>
                  <span className="value">
                    {preview.tipo === 'mesmo_preco'
                      ? formatarPrecoCentavos(0)
                      : `≈ ${formatarPrecoCentavos(Math.abs(preview.estimativaCobrancaCentavos))}`}
                  </span>
                </EffectRow>

                {(preview.usoExcederiaNovoPlano?.quadras || preview.usoExcederiaNovoPlano?.estabelecimentos) && (
                  <WarningBox>
                    <AlertTriangle size={18} />
                    <span>
                      Seu uso atual excede o plano {trocaPlano.nome}
                      {preview.usoExcederiaNovoPlano.quadras && preview.usoExcederiaNovoPlano.estabelecimentos
                        ? ' em quadras e estabelecimentos'
                        : preview.usoExcederiaNovoPlano.quadras ? ' em quadras' : ' em estabelecimentos'}.
                      {' '}Nada do que já existe será removido, mas novas criações ficarão bloqueadas até o uso caber
                      no limite ou você escolher um plano maior.
                    </span>
                  </WarningBox>
                )}
              </>
            )}

            <ModalActions>
              <CancelBtn type="button" onClick={() => setTrocaPlano(null)} disabled={confirmando}>
                Cancelar
              </CancelBtn>
              <ConfirmBtn type="button" onClick={confirmarTroca} disabled={confirmando || previewLoading}>
                {confirmando ? 'Trocando...' : 'Confirmar troca'}
              </ConfirmBtn>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
    </DashboardLayout>
  )
}

function BarraDeUso({ label, usado, limite }: { label: string; usado: number; limite: number | null | undefined }) {
  const excedeu = limite !== null && limite !== undefined && usado > limite
  const pct = limite == null ? 0 : limite === 0 ? 100 : (usado / limite) * 100

  return (
    <UsageItem>
      <UsageLabel>{label}</UsageLabel>
      <UsageValue $exceeded={excedeu}>
        {limite === undefined ? `${usado} cadastrados · escolha um plano` : `${usado} de ${limiteLabel(limite)}`}
      </UsageValue>
      {limite !== null && limite !== undefined && (
        <UsageBar>
          <UsageBarFill $pct={pct} $exceeded={excedeu} />
        </UsageBar>
      )}
    </UsageItem>
  )
}
