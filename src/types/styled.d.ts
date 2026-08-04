import "styled-components";
import type { AppTheme } from "../styles/theme.ts";

/**
 * Sem esta augmentation, o `theme` dentro de todo styled-component é o
 * DefaultTheme vazio do styled-components — e cada `theme.colors.primary`,
 * `theme.fontSizes.md`, `theme.spacing[4]` é um acesso a propriedade
 * inexistente. Eram ~2400 erros num projeto de 106 arquivos, todos com a mesma
 * causa.
 *
 * O tipo vem do próprio objeto de tema (AppTheme = typeof lightTheme), então
 * acompanha qualquer mudança nele: remover uma cor quebra o build de quem a
 * usa, em vez de virar `undefined` no CSS e sumir visualmente.
 */
declare module "styled-components" {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface DefaultTheme extends AppTheme {}
}
