import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, MapPin, Calendar, Users, Trophy, X, Layers } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import { MainLayout } from '../../components'
import TournamentBracket from '../../components/TournamentBracket'
import { listTournaments, createTournament, createDivision } from '../../services/tournaments'
import { list as listPlaces } from '../../services/places'
import {
  Container, PageHeader, Title, Subtitle, CreateButton,
  FiltersBar, FilterChip,
  Grid, TournamentCard, CardTop, TournamentName, StatusBadge,
  CardMeta, MetaRow, ViewBracketBtn,
  BracketSection, BracketTitle,
  Modal, ModalBox, ModalHeader, ModalTitle, CloseBtn,
  Form, Field, Label, Input, Select, ErrorMsg,
  ModalActions, CancelButton, SubmitButton,
  EmptyState, LoadingState,
  FormatHint, FormatPreview,
  CategorySection, CatChipsRow, PresetChip, CatTag, CatTagRemove, CatInput,
} from './styles'

const STATUS_FILTERS = [
  { label: 'Todos',           value: '' },
  { label: 'Inscrições abertas', value: 'OPEN' },
  { label: 'Em andamento',    value: 'IN_PROGRESS' },
  { label: 'Encerrados',      value: 'FINISHED' },
]

const STATUS_LABELS = {
  DRAFT:               'Rascunho',
  OPEN:                'Inscrições abertas',
  REGISTRATION_CLOSED: 'Inscrições encerradas',
  IN_PROGRESS:         'Em andamento',
  FINISHED:            'Encerrado',
  CANCELLED:           'Cancelado',
}

const FORMATS = [
  { value: 'KNOCKOUT',            label: 'Eliminatório Simples' },
  { value: 'LEAGUE',              label: 'Pontos Corridos' },
  { value: 'GROUPS_AND_KNOCKOUT', label: 'Grupos + Eliminatório' },
  { value: 'DOUBLE_ELIMINATION',  label: 'Dupla Eliminação' },
  { value: 'SWISS',               label: 'Sistema Suíço' },
]

const FORMAT_ICONS = {
  KNOCKOUT:            '⚡',
  LEAGUE:              '📊',
  GROUPS_AND_KNOCKOUT: '🎯',
  DOUBLE_ELIMINATION:  '🔁',
  SWISS:               '♟️',
}

const FORMAT_INFO = {
  KNOCKOUT:            { desc: 'Times se eliminam a cada rodada — perde, está fora.', hint: 'Funciona melhor com potência de 2: 4, 8, 16 ou 32 times.' },
  LEAGUE:              { desc: 'Todos jogam entre si e acumulam pontos na tabela.',    hint: 'Mínimo recomendado: 3 times.' },
  GROUPS_AND_KNOCKOUT: { desc: 'Fase de grupos seguida de eliminatória entre os melhores.', hint: 'Mínimo recomendado: 4 times.' },
  DOUBLE_ELIMINATION:  { desc: 'Cada time precisa perder duas vezes para ser eliminado — há chave de perdedores.', hint: 'Mínimo recomendado: 4 times.' },
  SWISS:               { desc: 'Rodadas pareadas por desempenho — ninguém é eliminado até o fim.', hint: 'Flexível, mínimo 4 times.' },
}

const FORMAT_PLACEHOLDER = {
  KNOCKOUT:            'Ex: 8 (potência de 2: 4, 8, 16, 32)',
  LEAGUE:              'Ex: 6 (mínimo 3)',
  GROUPS_AND_KNOCKOUT: 'Ex: 8 (mínimo 4)',
  DOUBLE_ELIMINATION:  'Ex: 8 (mínimo 4)',
  SWISS:               'Ex: 8 (mínimo 4)',
}

const FORMAT_SVG = {
  KNOCKOUT: (
    <svg viewBox="0 0 210 88" width="210" height="88">
      <rect x="0" y="4" width="64" height="14" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <text x="4" y="14" fill="#64748b" fontSize="8.5" fontFamily="system-ui,sans-serif">Time 1</text>
      <rect x="0" y="22" width="64" height="14" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <text x="4" y="32" fill="#64748b" fontSize="8.5" fontFamily="system-ui,sans-serif">Time 2</text>
      <rect x="0" y="50" width="64" height="14" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <text x="4" y="60" fill="#64748b" fontSize="8.5" fontFamily="system-ui,sans-serif">Time 3</text>
      <rect x="0" y="68" width="64" height="14" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <text x="4" y="78" fill="#64748b" fontSize="8.5" fontFamily="system-ui,sans-serif">Time 4</text>
      <line x1="64" y1="11" x2="72" y2="11" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="29" x2="72" y2="29" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="72" y1="11" x2="72" y2="29" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="72" y1="20" x2="80" y2="20" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="57" x2="72" y2="57" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="75" x2="72" y2="75" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="72" y1="57" x2="72" y2="75" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="72" y1="66" x2="80" y2="66" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <rect x="80" y="13" width="64" height="14" rx="2" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <text x="84" y="23" fill="#16a34a" fontSize="8.5" fontFamily="system-ui,sans-serif">Semifinal 1</text>
      <rect x="80" y="59" width="64" height="14" rx="2" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <text x="84" y="69" fill="#16a34a" fontSize="8.5" fontFamily="system-ui,sans-serif">Semifinal 2</text>
      <line x1="144" y1="20" x2="152" y2="20" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="144" y1="66" x2="152" y2="66" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="152" y1="20" x2="152" y2="66" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="152" y1="43" x2="158" y2="43" stroke="rgba(234,179,8,0.6)" strokeWidth="1"/>
      <rect x="158" y="36" width="52" height="14" rx="2" fill="rgba(234,179,8,0.12)" stroke="rgba(234,179,8,0.6)" strokeWidth="1"/>
      <text x="162" y="46" fill="#ca8a04" fontSize="8.5" fontFamily="system-ui,sans-serif" fontWeight="bold">🏆 Final</text>
    </svg>
  ),

  LEAGUE: (
    <svg viewBox="0 0 210 78" width="210" height="78">
      <line x1="110" y1="0" x2="110" y2="78" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5"/>
      <line x1="136" y1="0" x2="136" y2="78" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5"/>
      <line x1="162" y1="0" x2="162" y2="78" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5"/>
      <line x1="188" y1="0" x2="188" y2="78" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5"/>
      <rect x="0" y="0" width="210" height="14" rx="2" fill="rgba(100,116,139,0.15)"/>
      <text x="4" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">Time</text>
      <text x="123" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold" textAnchor="middle">J</text>
      <text x="149" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold" textAnchor="middle">V</text>
      <text x="175" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold" textAnchor="middle">D</text>
      <text x="199" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold" textAnchor="middle">Pts</text>
      <rect x="0" y="16" width="210" height="14" rx="2" fill="rgba(234,179,8,0.08)" stroke="rgba(234,179,8,0.3)" strokeWidth="0.5"/>
      <text x="4" y="25.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">1. Time A</text>
      <text x="123" y="25.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">5</text>
      <text x="149" y="25.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">4</text>
      <text x="175" y="25.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">1</text>
      <text x="199" y="25.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold" textAnchor="middle">12</text>
      <rect x="0" y="32" width="210" height="14" rx="2" fill="rgba(100,116,139,0.05)"/>
      <text x="4" y="41.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">2. Time B</text>
      <text x="123" y="41.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">5</text>
      <text x="149" y="41.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">3</text>
      <text x="175" y="41.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">2</text>
      <text x="199" y="41.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">9</text>
      <rect x="0" y="48" width="210" height="14" rx="2" fill="rgba(100,116,139,0.05)"/>
      <text x="4" y="57.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">3. Time C</text>
      <text x="123" y="57.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">5</text>
      <text x="149" y="57.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">2</text>
      <text x="175" y="57.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">3</text>
      <text x="199" y="57.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">6</text>
      <rect x="0" y="64" width="210" height="14" rx="2" fill="rgba(100,116,139,0.05)"/>
      <text x="4" y="73.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">4. Time D</text>
      <text x="123" y="73.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">5</text>
      <text x="149" y="73.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">1</text>
      <text x="175" y="73.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">4</text>
      <text x="199" y="73.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" textAnchor="middle">3</text>
    </svg>
  ),

  GROUPS_AND_KNOCKOUT: (
    <svg viewBox="0 0 210 102" width="210" height="102">
      <rect x="0" y="0" width="96" height="13" rx="2" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" strokeWidth="0.8"/>
      <text x="4" y="9.5" fill="#3b82f6" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">Grupo A</text>
      <rect x="0" y="15" width="96" height="12" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="4" y="23.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">Time 1</text>
      <rect x="0" y="29" width="96" height="12" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="4" y="37.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">Time 2</text>
      <rect x="114" y="0" width="96" height="13" rx="2" fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.5)" strokeWidth="0.8"/>
      <text x="118" y="9.5" fill="#ea580c" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">Grupo B</text>
      <rect x="114" y="15" width="96" height="12" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="118" y="23.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">Time 3</text>
      <rect x="114" y="29" width="96" height="12" rx="2" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="118" y="37.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">Time 4</text>
      <line x1="48" y1="42" x2="48" y2="53" stroke="rgba(100,116,139,0.5)" strokeWidth="0.8"/>
      <polygon points="48,54 45,51 51,51" fill="rgba(100,116,139,0.5)"/>
      <line x1="162" y1="42" x2="162" y2="53" stroke="rgba(100,116,139,0.5)" strokeWidth="0.8"/>
      <polygon points="162,54 159,51 165,51" fill="rgba(100,116,139,0.5)"/>
      <rect x="0" y="55" width="96" height="13" rx="2" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <text x="4" y="64.5" fill="#16a34a" fontSize="8" fontFamily="system-ui,sans-serif">Semifinal 1</text>
      <rect x="114" y="55" width="96" height="13" rx="2" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <text x="118" y="64.5" fill="#16a34a" fontSize="8" fontFamily="system-ui,sans-serif">Semifinal 2</text>
      <line x1="48" y1="69" x2="48" y2="80" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="162" y1="69" x2="162" y2="80" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="48" y1="80" x2="162" y2="80" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="105" y1="80" x2="105" y2="88" stroke="rgba(234,179,8,0.6)" strokeWidth="1"/>
      <rect x="79" y="88" width="52" height="13" rx="2" fill="rgba(234,179,8,0.12)" stroke="rgba(234,179,8,0.6)" strokeWidth="1"/>
      <text x="83" y="97.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">🏆 Final</text>
    </svg>
  ),

  DOUBLE_ELIMINATION: (
    <svg viewBox="0 0 210 96" width="210" height="96">
      <text x="0" y="5" fill="rgba(34,197,94,0.8)" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="bold">WINNERS</text>
      <rect x="0" y="8" width="56" height="14" rx="2" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.5"/>
      <text x="4" y="17.5" fill="#16a34a" fontSize="8" fontFamily="system-ui,sans-serif">Time 1</text>
      <rect x="0" y="26" width="56" height="14" rx="2" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.5"/>
      <text x="4" y="35.5" fill="#16a34a" fontSize="8" fontFamily="system-ui,sans-serif">Time 2</text>
      <line x1="56" y1="15" x2="64" y2="15" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8"/>
      <line x1="56" y1="33" x2="64" y2="33" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="15" x2="64" y2="33" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="24" x2="72" y2="24" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8"/>
      <rect x="72" y="17" width="64" height="14" rx="2" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <text x="76" y="26.5" fill="#16a34a" fontSize="8" fontFamily="system-ui,sans-serif">SF Winners</text>
      <line x1="0" y1="48" x2="210" y2="48" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" strokeDasharray="3,3"/>
      <text x="0" y="57" fill="rgba(249,115,22,0.8)" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="bold">LOSERS</text>
      <rect x="0" y="60" width="56" height="14" rx="2" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.4)" strokeWidth="0.5"/>
      <text x="4" y="69.5" fill="#ea580c" fontSize="8" fontFamily="system-ui,sans-serif">Perdedor 1</text>
      <rect x="0" y="78" width="56" height="14" rx="2" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.4)" strokeWidth="0.5"/>
      <text x="4" y="87.5" fill="#ea580c" fontSize="8" fontFamily="system-ui,sans-serif">Perdedor 2</text>
      <line x1="56" y1="67" x2="64" y2="67" stroke="rgba(249,115,22,0.4)" strokeWidth="0.8"/>
      <line x1="56" y1="85" x2="64" y2="85" stroke="rgba(249,115,22,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="67" x2="64" y2="85" stroke="rgba(249,115,22,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="76" x2="72" y2="76" stroke="rgba(249,115,22,0.4)" strokeWidth="0.8"/>
      <rect x="72" y="69" width="64" height="14" rx="2" fill="rgba(249,115,22,0.12)" stroke="rgba(249,115,22,0.5)" strokeWidth="0.8"/>
      <text x="76" y="78.5" fill="#ea580c" fontSize="8" fontFamily="system-ui,sans-serif">SF Losers</text>
      <line x1="136" y1="24" x2="144" y2="24" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8"/>
      <line x1="136" y1="76" x2="144" y2="76" stroke="rgba(249,115,22,0.5)" strokeWidth="0.8"/>
      <line x1="144" y1="24" x2="144" y2="76" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="144" y1="50" x2="148" y2="50" stroke="rgba(234,179,8,0.6)" strokeWidth="1"/>
      <rect x="148" y="43" width="62" height="14" rx="2" fill="rgba(234,179,8,0.12)" stroke="rgba(234,179,8,0.6)" strokeWidth="1"/>
      <text x="151" y="52.5" fill="#ca8a04" fontSize="7.5" fontFamily="system-ui,sans-serif" fontWeight="bold">🏆 Grande Final</text>
    </svg>
  ),

  SWISS: (
    <svg viewBox="0 0 210 76" width="210" height="76">
      <rect x="0" y="0" width="64" height="13" rx="2" fill="rgba(100,116,139,0.15)"/>
      <text x="4" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">Rodada 1</text>
      <rect x="73" y="0" width="64" height="13" rx="2" fill="rgba(100,116,139,0.15)"/>
      <text x="77" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">Rodada 2</text>
      <rect x="146" y="0" width="64" height="13" rx="2" fill="rgba(100,116,139,0.15)"/>
      <text x="150" y="9.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="bold">Rodada 3</text>
      <rect x="0" y="16" width="64" height="12" rx="2" fill="rgba(100,116,139,0.08)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="4" y="24.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">A × B</text>
      <rect x="0" y="31" width="64" height="12" rx="2" fill="rgba(100,116,139,0.08)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="4" y="39.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">C × D</text>
      <line x1="64" y1="22" x2="73" y2="22" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="64" y1="37" x2="73" y2="37" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <rect x="73" y="16" width="64" height="12" rx="2" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.35)" strokeWidth="0.5"/>
      <text x="77" y="24.5" fill="#16a34a" fontSize="8" fontFamily="system-ui,sans-serif">A × C</text>
      <rect x="73" y="31" width="64" height="12" rx="2" fill="rgba(100,116,139,0.08)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="77" y="39.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">B × D</text>
      <line x1="137" y1="22" x2="146" y2="22" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <line x1="137" y1="37" x2="146" y2="37" stroke="rgba(100,116,139,0.4)" strokeWidth="0.8"/>
      <rect x="146" y="16" width="64" height="12" rx="2" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.4)" strokeWidth="0.5"/>
      <text x="150" y="24.5" fill="#ca8a04" fontSize="8" fontFamily="system-ui,sans-serif">A × D</text>
      <rect x="146" y="31" width="64" height="12" rx="2" fill="rgba(100,116,139,0.08)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5"/>
      <text x="150" y="39.5" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">B × C</text>
      <line x1="0" y1="50" x2="210" y2="50" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5"/>
      <rect x="0" y="55" width="7" height="7" rx="1" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.35)" strokeWidth="0.5"/>
      <text x="10" y="62" fill="#64748b" fontSize="7" fontFamily="system-ui,sans-serif">Líderes se enfrentam</text>
      <rect x="0" y="65" width="7" height="7" rx="1" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.4)" strokeWidth="0.5"/>
      <text x="10" y="72" fill="#64748b" fontSize="7" fontFamily="system-ui,sans-serif">Decisivo — ninguém é eliminado</text>
    </svg>
  ),
}

const PRESET_CATEGORIES = ['Feminino', 'Masculino', 'Misto', 'Amador', 'Iniciante', 'Open', 'Profissional']

const schema = yup.object({
  name:            yup.string().required('Informe o nome do torneio'),
  sportType:       yup.string().required('Selecione a modalidade'),
  format:          yup.string().required('Selecione o formato'),
  placeId:         yup.string().required('Selecione o estabelecimento'),
  startDate:       yup.string().nullable(),
  endDate:         yup.string().nullable(),
  maxParticipants: yup.number().typeError('Número inválido').min(2).nullable(),
  registrationFee: yup.number().typeError('Valor inválido').min(0).nullable(),
  description:     yup.string().nullable(),
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function Tournaments() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { sports } = useSports()
  const canCreate  = user?.role === 'OWNER' || user?.role === 'ADMIN'

  const sportLabels = useMemo(() =>
    Object.fromEntries(sports.map(s => [s.id, `${s.icon} ${s.label}`])),
    [sports]
  )
  const sportOptions = useMemo(() =>
    sports.map(s => ({ value: s.id, label: `${s.icon} ${s.label}` })),
    [sports]
  )

  const [tournaments, setTournaments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected]         = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const [places, setPlaces]             = useState([])
  const [submitting, setSubmitting]     = useState(false)
  const [apiError, setApiError]         = useState(null)
  const [categories, setCategories]     = useState([])
  const [catInput, setCatInput]         = useState('')
  const [multiCategory, setMultiCategory] = useState(false)

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const watchedFormat = useWatch({ control, name: 'format' })

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listTournaments(statusFilter ? { status: statusFilter } : {})
      setTournaments(Array.isArray(res.data) ? res.data : [])
    } catch {
      setTournaments([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchTournaments() }, [fetchTournaments])

  // Carrega estabelecimentos: owner vê só os seus, admin vê todos
  useEffect(() => {
    if (!showModal) return
    listPlaces()
      .then((res) => {
        const body = res?.data ?? res ?? {}
        const all = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : [])
        const filtered = user?.role === 'OWNER'
          ? all.filter(p => p.owner?.id === user.id)
          : all
        setPlaces(filtered)
      })
      .catch(() => setPlaces([]))
  }, [showModal, user])

  function closeModal() {
    setShowModal(false)
    reset()
    setCategories([])
    setCatInput('')
    setMultiCategory(false)
    setApiError(null)
  }

  function addCategory(name) {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setCategories(prev => [...prev, trimmed])
    setCatInput('')
  }

  function removeCategory(name) {
    setCategories(prev => prev.filter(c => c !== name))
  }

  function handleCatKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory(catInput)
    }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    setApiError(null)
    try {
      const payload = {
        ...data,
        organizerType:    'PLACE',
        participantType:  'TEAM',
        registrationMode: 'OPEN',
        startDate:        data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate:          data.endDate   ? new Date(data.endDate).toISOString()   : null,
        maxParticipants:  data.maxParticipants ? Number(data.maxParticipants) : null,
        registrationFee:  data.registrationFee ? Number(data.registrationFee) : null,
      }
      const res = await createTournament(payload)
      const tournamentId = res.data?.id ?? res.id

      if (tournamentId && categories.length > 0) {
        await Promise.allSettled(
          categories.map(cat => createDivision(tournamentId, { name: cat }))
        )
      }

      toast.success('Torneio criado com sucesso!')
      closeModal()
      fetchTournaments()
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao criar torneio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout user={user}>
      <Container>

        {/* ── Cabeçalho ── */}
        <PageHeader>
          <div>
            <Title>Torneios</Title>
            <Subtitle>
              {loading ? 'Carregando...' : `${tournaments.length} torneio${tournaments.length !== 1 ? 's' : ''} encontrado${tournaments.length !== 1 ? 's' : ''}`}
            </Subtitle>
          </div>
          {canCreate && (
            <CreateButton onClick={() => setShowModal(true)}>
              <Plus size={16} />
              Novo Torneio
            </CreateButton>
          )}
        </PageHeader>

        {/* ── Filtros ── */}
        <FiltersBar>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              $active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </FilterChip>
          ))}
        </FiltersBar>

        {/* ── Lista de torneios ── */}
        {loading ? (
          <LoadingState>Carregando torneios...</LoadingState>
        ) : tournaments.length === 0 ? (
          <EmptyState>
            <span>🏆</span>
            <p>Nenhum torneio encontrado.</p>
          </EmptyState>
        ) : (
          <Grid>
            {tournaments.map((t) => {
              const fmt = FORMATS.find(f => f.value === t.format)
              const divCount = t._count?.divisions ?? 0
              return (
                <TournamentCard key={t.id} onClick={() => navigate(`/torneios/${t.id}`)}>
                  <CardTop>
                    <TournamentName>
                      {sportLabels[t.sportType] ?? t.sportType} {t.name}
                    </TournamentName>
                    <StatusBadge $status={t.status}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </StatusBadge>
                  </CardTop>

                  <CardMeta>
                    {fmt && (
                      <MetaRow>
                        <span style={{ fontSize: 14 }}>{FORMAT_ICONS[t.format]}</span>
                        {fmt.label}
                      </MetaRow>
                    )}
                    <MetaRow>
                      <Calendar />
                      {formatDate(t.startDate)} → {formatDate(t.endDate)}
                    </MetaRow>
                    {t.place?.name && (
                      <MetaRow><MapPin />{t.place.name}</MetaRow>
                    )}
                    {t.maxParticipants && (
                      <MetaRow><Users />{t.maxParticipants} times</MetaRow>
                    )}
                    {divCount > 0 && (
                      <MetaRow>
                        <Layers size={14} />
                        {divCount} categoria{divCount !== 1 ? 's' : ''}
                      </MetaRow>
                    )}
                    {t.registrationFee > 0 && (
                      <MetaRow>
                        <Trophy size={14} />
                        Taxa: R$ {Number(t.registrationFee).toFixed(2)}
                      </MetaRow>
                    )}
                  </CardMeta>

                  <ViewBracketBtn onClick={(e) => {
                    e.stopPropagation()
                    setSelected(selected?.id === t.id ? null : t)
                  }}>
                    {selected?.id === t.id ? '▲ Fechar Chaveamento' : '🏆 Ver Chaveamento'}
                  </ViewBracketBtn>
                </TournamentCard>
              )
            })}
          </Grid>
        )}

        {/* ── Bracket do torneio selecionado ── */}
        {selected && (
          <BracketSection>
            <BracketTitle>🏆 Chaveamento — {selected.name}</BracketTitle>
            <TournamentBracket tournamentId={selected.id} />
          </BracketSection>
        )}

        {/* ── Modal de criação ── */}
        {showModal && (
          <Modal onClick={closeModal}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Novo Torneio</ModalTitle>
                <CloseBtn onClick={closeModal}>
                  <X size={20} />
                </CloseBtn>
              </ModalHeader>

              <Form onSubmit={handleSubmit(onSubmit)}>
                <Field>
                  <Label>Nome do torneio *</Label>
                  <Input
                    {...register('name')}
                    $error={!!errors.name}
                    placeholder="Ex: Copa Só+1 Verão 2025"
                  />
                  {errors.name && <ErrorMsg>{errors.name.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Modalidade *</Label>
                  <Select {...register('sportType')} $error={!!errors.sportType}>
                    <option value="">Selecione...</option>
                    {sportOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                  {errors.sportType && <ErrorMsg>{errors.sportType.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Formato *</Label>
                  <Select {...register('format')} $error={!!errors.format}>
                    <option value="">Selecione...</option>
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </Select>
                  {errors.format && <ErrorMsg>{errors.format.message}</ErrorMsg>}
                  {watchedFormat && FORMAT_INFO[watchedFormat] && (
                    <FormatHint>
                      <span>{FORMAT_INFO[watchedFormat].desc}</span>
                      <small>{FORMAT_INFO[watchedFormat].hint}</small>
                    </FormatHint>
                  )}
                  {watchedFormat && FORMAT_SVG[watchedFormat] && (
                    <FormatPreview>
                      {FORMAT_SVG[watchedFormat]}
                    </FormatPreview>
                  )}
                </Field>

                <Field>
                  <Label>Estabelecimento *</Label>
                  <Select {...register('placeId')} $error={!!errors.placeId}>
                    <option value="">Selecione...</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                  {places.length === 0 && (
                    <ErrorMsg style={{ color: '#f59e0b' }}>
                      {user?.role === 'OWNER'
                        ? 'Nenhum estabelecimento vinculado à sua conta.'
                        : 'Nenhum estabelecimento cadastrado.'}
                    </ErrorMsg>
                  )}
                  {errors.placeId && <ErrorMsg>{errors.placeId.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Data de início</Label>
                  <Input type="date" {...register('startDate')} />
                </Field>

                <Field>
                  <Label>Data de término</Label>
                  <Input type="date" {...register('endDate')} />
                </Field>

                <Field>
                  <Label>Máximo de times</Label>
                  <Input
                    type="number" min={2}
                    placeholder={FORMAT_PLACEHOLDER[watchedFormat] ?? 'Ex: 8'}
                    {...register('maxParticipants')}
                  />
                  {errors.maxParticipants && <ErrorMsg>{errors.maxParticipants.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Taxa de inscrição (R$)</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    placeholder="Ex: 50.00"
                    {...register('registrationFee')}
                  />
                </Field>

                {/* Pergunta: múltiplas categorias? */}
                <Field>
                  <Label>Vai ter mais de uma categoria?</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <FilterChip
                      type="button"
                      $active={!multiCategory}
                      onClick={() => { setMultiCategory(false); setCategories([]); setCatInput('') }}
                    >
                      Não
                    </FilterChip>
                    <FilterChip
                      type="button"
                      $active={multiCategory}
                      onClick={() => setMultiCategory(true)}
                    >
                      Sim
                    </FilterChip>
                  </div>
                </Field>

                {/* Categorias (divisões) — só exibe se o usuário escolheu "Sim" */}
                {multiCategory && (
                  <CategorySection>
                    <Label>Categorias</Label>
                    <CatChipsRow>
                      {PRESET_CATEGORIES.filter(c => !categories.includes(c)).map(c => (
                        <PresetChip key={c} type="button" onClick={() => addCategory(c)}>{c}</PresetChip>
                      ))}
                    </CatChipsRow>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {categories.map(cat => (
                        <CatTag key={cat}>
                          {cat}
                          <CatTagRemove type="button" onClick={() => removeCategory(cat)}>
                            <X size={12} />
                          </CatTagRemove>
                        </CatTag>
                      ))}
                      <CatInput
                        type="text"
                        placeholder="Outra categoria..."
                        value={catInput}
                        onChange={e => setCatInput(e.target.value)}
                        onKeyDown={handleCatKeyDown}
                        onBlur={() => catInput.trim() && addCategory(catInput)}
                      />
                    </div>
                  </CategorySection>
                )}

                <Field>
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Regras, premiação, etc."
                    {...register('description')}
                  />
                </Field>

                {apiError && (
                  <ErrorMsg style={{ padding: '10px', background: '#fff5f5', borderRadius: '6px' }}>
                    ⚠️ {apiError}
                  </ErrorMsg>
                )}

                <ModalActions>
                  <CancelButton type="button" onClick={closeModal}>
                    Cancelar
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting ? 'Criando...' : 'Criar Torneio'}
                  </SubmitButton>
                </ModalActions>
              </Form>
            </ModalBox>
          </Modal>
        )}

      </Container>
    </MainLayout>
  )
}
