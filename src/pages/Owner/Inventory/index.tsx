import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import {
  AlertTriangle, ArrowDown, ArrowUp, History, Loader2, Package, Plus, ShoppingCart,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/AuthContext'
import { useSubscription } from '../../../hooks/useSubscription'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { inventoryService } from '../../../services/inventoryService'
import type { MovementInput, ProductInput } from '../../../services/inventoryService'
import * as placesService from '../../../services/places'
import type {
  InventoryMovement, InventoryMovementReason, InventoryMovementType, InventoryProduct,
  InventoryUnit, Place,
} from '../../../types/api'
import { codigoDeErro, mensagemDeErro } from '../../../utils/apiError'
import { toastErroDeApi } from '../../../utils/toastErro'
import {
  Actions, AlertBadge, DangerActions, DangerButton, EmptyState, FilterToggle, FormGrid,
  HeaderActions, HistoryCard, HistoryHeader, HistoryItem, HistoryList, Input, Label, Modal,
  ModalActions, ModalBox, ModalOverlay, PageGrid, PrimaryButton, ProductCard, ProductGrid,
  ProductHeader, ProductMeta, QuickSale, SaleButton, SecondaryButton, Select, StockNumber,
  StockSummary, SummaryCard, Textarea, Toolbar,
} from './styles'

const UNIDADES: Array<{ value: InventoryUnit; label: string }> = [
  { value: 'UNIDADE', label: 'Unidade' },
  { value: 'GARRAFA', label: 'Garrafa' },
  { value: 'LATA', label: 'Lata' },
  { value: 'PACOTE', label: 'Pacote' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'QUILOGRAMA', label: 'Quilograma' },
]

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const MOTIVO_LABEL: Record<InventoryMovementReason, string> = {
  COMPRA: 'Compra',
  REPOSICAO: 'Reposição',
  VENDA: 'Venda',
  PERDA: 'Perda',
  AJUSTE: 'Ajuste',
}
const productEmpty: ProductInput = {
  nome: '',
  unidade: 'UNIDADE',
  precoVendaCentavos: 0,
  quantidadeAtual: 0,
  estoqueMinimo: 0,
}

type MovementModal = { product: InventoryProduct; tipo: InventoryMovementType }

export default function OwnerInventory() {
  const { user } = useAuth()
  const { sub, isActive, loading: subLoading, podeAlterar } = useSubscription()
  const [searchParams, setSearchParams] = useSearchParams()
  const [places, setPlaces] = useState<Place[]>([])
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lowOnly, setLowOnly] = useState(false)
  const [historyProductId, setHistoryProductId] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [editing, setEditing] = useState<InventoryProduct | null>(null)
  const [productForm, setProductForm] = useState<ProductInput>(productEmpty)
  const [movementModal, setMovementModal] = useState<MovementModal | null>(null)
  const [movementForm, setMovementForm] = useState<MovementInput>({
    tipo: 'ENTRADA',
    motivo: 'REPOSICAO',
    quantidade: 1,
  })
  const [saleQuantities, setSaleQuantities] = useState<Record<string, string>>({})

  const placeId = searchParams.get('placeId') ?? ''

  useEffect(() => {
    placesService.list().then((res) => {
      const available = user?.role === 'ADMIN'
        ? res.data.data
        : res.data.data.filter((place) => place.ownerId === user?.id)
      setPlaces(available)
      if (!placeId && available[0]) {
        setSearchParams({ placeId: available[0].id }, { replace: true })
      }
    }).catch((error) => toastErroDeApi(error, 'Não foi possível carregar os estabelecimentos.'))
  }, [placeId, setSearchParams, user?.id, user?.role])

  const loadInventory = useCallback(async () => {
    if (!placeId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [productData, movementData] = await Promise.all([
        inventoryService.listProducts(placeId, lowOnly || undefined),
        inventoryService.listMovements(placeId, historyProductId || undefined),
      ])
      setProducts(productData)
      setMovements(movementData)
    } catch (error) {
      toastErroDeApi(error, 'Não foi possível carregar o estoque.')
    } finally {
      setLoading(false)
    }
  }, [historyProductId, lowOnly, placeId])

  useEffect(() => {
    void loadInventory()
  }, [loadInventory])

  const lowCount = products.filter((product) => product.estoqueBaixo).length
  const unitsInStock = products.reduce((total, product) => total + product.saldoAtual, 0)
  const selectedPlace = places.find((place) => place.id === placeId)

  const openNew = () => {
    setEditing(null)
    setProductForm(productEmpty)
    setProductModal(true)
  }

  const openEdit = (product: InventoryProduct) => {
    setEditing(product)
    setProductForm({
      nome: product.nome,
      unidade: product.unidade,
      precoVendaCentavos: product.precoVendaCentavos,
      quantidadeAtual: 0,
      estoqueMinimo: product.estoqueMinimo,
    })
    setProductModal(true)
  }

  const saveProduct = async () => {
    if (!podeAlterar || !placeId) return
    if (!productForm.nome.trim()) {
      toast.error('Informe o nome do produto.')
      return
    }

    try {
      setSaving(true)
      if (editing) {
        const { quantidadeAtual: _, ...data } = productForm
        await inventoryService.updateProduct(placeId, editing.id, data)
        toast.success('Produto atualizado.')
      } else {
        await inventoryService.createProduct(placeId, productForm)
        toast.success('Produto cadastrado.')
      }
      setProductModal(false)
      await loadInventory()
    } catch (error) {
      toastErroDeApi(error, 'Não foi possível salvar o produto.')
    } finally {
      setSaving(false)
    }
  }

  const deactivateProduct = async (product: InventoryProduct, askConfirmation = true) => {
    if (!podeAlterar || !placeId) return
    if (askConfirmation && !window.confirm(`Desativar o produto "${product.nome}"?`)) return

    try {
      setSaving(true)
      await inventoryService.updateProduct(placeId, product.id, { ativo: false })
      setProductModal(false)
      toast.success('Produto desativado. O histórico foi preservado.')
      await loadInventory()
    } catch (error) {
      toastErroDeApi(error, 'Não foi possível desativar o produto.')
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product: InventoryProduct) => {
    if (!podeAlterar || !placeId) return
    if (!window.confirm(`Excluir o produto "${product.nome}"? Esta ação não pode ser desfeita.`)) return

    try {
      setSaving(true)
      await inventoryService.deleteProduct(placeId, product.id)
      setProductModal(false)
      toast.success('Produto excluído.')
      await loadInventory()
    } catch (error) {
      if (codigoDeErro(error) === 'PRODUCT_HAS_MOVEMENTS') {
        toast.error(mensagemDeErro(error, 'Este produto tem movimentações e não pode ser excluído.'), {
          duration: 8000,
          action: {
            label: 'Desativar',
            onClick: () => { void deactivateProduct(product, false) },
          },
        })
      } else {
        toastErroDeApi(error, 'Não foi possível excluir o produto.')
      }
    } finally {
      setSaving(false)
    }
  }

  const sell = async (product: InventoryProduct) => {
    if (!podeAlterar) return
    const quantidade = Math.max(1, Number(saleQuantities[product.id]) || 1)

    try {
      setSaving(true)
      await inventoryService.createMovement(placeId, product.id, {
        tipo: 'SAIDA',
        motivo: 'VENDA',
        quantidade,
      })
      toast.success(`${quantidade} ${quantidade === 1 ? 'venda registrada' : 'vendas registradas'}.`)
      setSaleQuantities((current) => ({ ...current, [product.id]: '1' }))
      await loadInventory()
    } catch (error) {
      // PRODUCT_INSUFFICIENT_STOCK traz o saldo atual na mensagem da API.
      toastErroDeApi(error, 'Não foi possível registrar a venda.')
    } finally {
      setSaving(false)
    }
  }

  const openMovement = (product: InventoryProduct, tipo: InventoryMovementType) => {
    setMovementModal({ product, tipo })
    setMovementForm({
      tipo,
      motivo: tipo === 'ENTRADA' ? 'REPOSICAO' : 'PERDA',
      quantidade: 1,
      observacao: '',
    })
  }

  const movementReasons = useMemo(() => movementForm.tipo === 'ENTRADA'
    ? [['COMPRA', 'Compra'], ['REPOSICAO', 'Reposição'], ['AJUSTE', 'Ajuste']] as Array<[InventoryMovementReason, string]>
    : [['VENDA', 'Venda'], ['PERDA', 'Perda'], ['AJUSTE', 'Ajuste']] as Array<[InventoryMovementReason, string]>, [movementForm.tipo])

  const saveMovement = async () => {
    if (!podeAlterar || !movementModal) return
    if (movementForm.quantidade < 1) {
      toast.error('Informe uma quantidade válida.')
      return
    }

    try {
      setSaving(true)
      await inventoryService.createMovement(placeId, movementModal.product.id, movementForm)
      toast.success('Movimentação registrada.')
      setMovementModal(null)
      await loadInventory()
    } catch (error) {
      toastErroDeApi(error, 'Não foi possível registrar a movimentação.')
    } finally {
      setSaving(false)
    }
  }

  usePageHeader("Estoque", "Mercadorias vendidas no balcão, separadas por estabelecimento.")

  return (
    <>
      <SubscriptionGate isActive={isActive} loading={subLoading} sub={sub}>
      <Toolbar>
        <div>
          <Label htmlFor="place">Estabelecimento</Label>
          <Select
            id="place"
            value={placeId}
            onChange={(event) => {
              setHistoryProductId('')
              setSearchParams({ placeId: event.target.value })
            }}
          >
            {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
          </Select>
        </div>
        <HeaderActions>
          <FilterToggle>
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(event) => {
                setHistoryProductId('')
                setLowOnly(event.target.checked)
              }}
            />
            Só estoque baixo
          </FilterToggle>
          <PrimaryButton onClick={openNew} disabled={!placeId || !podeAlterar}>
            <Plus size={18} /> Novo produto
          </PrimaryButton>
        </HeaderActions>
      </Toolbar>

      {!placeId ? (
        <EmptyState>Nenhum estabelecimento disponível para controlar estoque.</EmptyState>
      ) : (
        <>
          <StockSummary>
            <SummaryCard>
              <Package />
              <div><strong>{products.length}</strong><span>produtos exibidos</span></div>
            </SummaryCard>
            <SummaryCard>
              <ShoppingCart />
              <div><strong>{unitsInStock}</strong><span>itens exibidos</span></div>
            </SummaryCard>
            <SummaryCard $warning={lowCount > 0}>
              <AlertTriangle />
              <div><strong>{lowCount}</strong><span>com estoque baixo</span></div>
            </SummaryCard>
          </StockSummary>

          <PageGrid>
            <section>
              {loading ? (
                <EmptyState><Loader2 /> Carregando estoque…</EmptyState>
              ) : products.length === 0 ? (
                <EmptyState>
                  {lowOnly
                    ? 'Nenhum produto está com estoque baixo.'
                    : `Cadastre a primeira mercadoria de ${selectedPlace?.name}.`}
                </EmptyState>
              ) : (
                <ProductGrid>
                  {products.map((product) => (
                    <ProductCard key={product.id} $low={product.estoqueBaixo}>
                      <ProductHeader>
                        <div>
                          <h3>{product.nome}</h3>
                          <ProductMeta>
                            {BRL.format(product.precoVendaCentavos / 100)} ·{' '}
                            {UNIDADES.find((unit) => unit.value === product.unidade)?.label}
                          </ProductMeta>
                        </div>
                        {product.estoqueBaixo && (
                          <AlertBadge><AlertTriangle size={14} /> Estoque baixo</AlertBadge>
                        )}
                      </ProductHeader>
                      <StockNumber $low={product.estoqueBaixo}>
                        <strong>{product.saldoAtual}</strong>
                        <span>em estoque · mínimo {product.estoqueMinimo}</span>
                      </StockNumber>
                      <QuickSale>
                        <Input
                          type="number"
                          min="1"
                          max={Math.max(1, product.saldoAtual)}
                          aria-label={`Quantidade de ${product.nome}`}
                          value={saleQuantities[product.id] ?? '1'}
                          onChange={(event) => setSaleQuantities((current) => ({
                            ...current,
                            [product.id]: event.target.value,
                          }))}
                        />
                        <SaleButton
                          onClick={() => { void sell(product) }}
                          disabled={saving || !podeAlterar || product.saldoAtual === 0}
                        >
                          <ShoppingCart size={18} /> Registrar venda
                        </SaleButton>
                      </QuickSale>
                      <Actions>
                        <SecondaryButton disabled={!podeAlterar} onClick={() => openMovement(product, 'ENTRADA')}>
                          <ArrowUp size={16} /> Entrada
                        </SecondaryButton>
                        <SecondaryButton disabled={!podeAlterar} onClick={() => openMovement(product, 'SAIDA')}>
                          <ArrowDown size={16} /> Perda/saída
                        </SecondaryButton>
                        <SecondaryButton onClick={() => setHistoryProductId(product.id)}>
                          <History size={16} /> Histórico
                        </SecondaryButton>
                        <SecondaryButton disabled={!podeAlterar} onClick={() => openEdit(product)}>
                          Editar
                        </SecondaryButton>
                      </Actions>
                    </ProductCard>
                  ))}
                </ProductGrid>
              )}
            </section>

            <HistoryCard>
              <HistoryHeader>
                <h2><History size={18} /> Histórico</h2>
                <Select
                  aria-label="Produto do histórico"
                  value={historyProductId}
                  onChange={(event) => setHistoryProductId(event.target.value)}
                >
                  <option value="">Todos os produtos</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.nome}</option>
                  ))}
                </Select>
              </HistoryHeader>
              <HistoryList>
                {movements.length === 0 ? (
                  <p>Nenhuma movimentação ainda.</p>
                ) : movements.map((movement) => (
                  <HistoryItem key={movement.id} $entry={movement.tipo === 'ENTRADA'}>
                    <div className="movement">
                      <strong>
                        {movement.tipo === 'ENTRADA' ? '+' : '-'}{movement.quantidade} ·{' '}
                        {movement.product.nome}
                      </strong>
                      <span>{MOTIVO_LABEL[movement.motivo]} por {movement.actor.name}</span>
                    </div>
                    <time>
                      {new Date(movement.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </time>
                  </HistoryItem>
                ))}
              </HistoryList>
            </HistoryCard>
          </PageGrid>
        </>
      )}

      {productModal && (
        <Modal>
          <ModalOverlay onClick={() => setProductModal(false)} />
          <ModalBox role="dialog" aria-modal="true">
            <h2>{editing ? 'Editar produto' : 'Novo produto'}</h2>
            <FormGrid>
              <div className="wide">
                <Label>Nome</Label>
                <Input
                  value={productForm.nome}
                  onChange={(event) => setProductForm({ ...productForm, nome: event.target.value })}
                  placeholder="Ex.: Gatorade"
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select
                  value={productForm.unidade}
                  onChange={(event) => setProductForm({
                    ...productForm,
                    unidade: event.target.value as InventoryUnit,
                  })}
                >
                  {UNIDADES.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Preço de venda (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.precoVendaCentavos / 100}
                  onChange={(event) => setProductForm({
                    ...productForm,
                    precoVendaCentavos: Math.round(Number(event.target.value) * 100),
                  })}
                />
              </div>
              {!editing && (
                <div>
                  <Label>Quantidade atual</Label>
                  <Input
                    type="number"
                    min="0"
                    value={productForm.quantidadeAtual}
                    onChange={(event) => setProductForm({
                      ...productForm,
                      quantidadeAtual: Number(event.target.value),
                    })}
                  />
                </div>
              )}
              <div>
                <Label>Estoque mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.estoqueMinimo}
                  onChange={(event) => setProductForm({
                    ...productForm,
                    estoqueMinimo: Number(event.target.value),
                  })}
                />
              </div>
            </FormGrid>
            <ModalActions>
              {editing && (
                <DangerActions>
                  <DangerButton onClick={() => { void deleteProduct(editing) }} disabled={saving}>
                    Excluir
                  </DangerButton>
                  <DangerButton onClick={() => { void deactivateProduct(editing) }} disabled={saving}>
                    Desativar
                  </DangerButton>
                </DangerActions>
              )}
              <SecondaryButton onClick={() => setProductModal(false)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={() => { void saveProduct() }} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </PrimaryButton>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}

      {movementModal && (
        <Modal>
          <ModalOverlay onClick={() => setMovementModal(null)} />
          <ModalBox role="dialog" aria-modal="true">
            <h2>{movementModal.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} · {movementModal.product.nome}</h2>
            <FormGrid>
              <div>
                <Label>Motivo</Label>
                <Select
                  value={movementForm.motivo}
                  onChange={(event) => setMovementForm({
                    ...movementForm,
                    motivo: event.target.value as InventoryMovementReason,
                  })}
                >
                  {movementReasons.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  autoFocus
                  type="number"
                  min="1"
                  value={movementForm.quantidade}
                  onChange={(event) => setMovementForm({
                    ...movementForm,
                    quantidade: Number(event.target.value),
                  })}
                />
              </div>
              <div className="wide">
                <Label>Observação (opcional)</Label>
                <Textarea
                  value={movementForm.observacao ?? ''}
                  onChange={(event) => setMovementForm({
                    ...movementForm,
                    observacao: event.target.value,
                  })}
                />
              </div>
            </FormGrid>
            <ModalActions>
              <SecondaryButton onClick={() => setMovementModal(null)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={() => { void saveMovement() }} disabled={saving}>
                {saving ? 'Registrando…' : 'Registrar'}
              </PrimaryButton>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
      </SubscriptionGate>
    </>
  )
}
