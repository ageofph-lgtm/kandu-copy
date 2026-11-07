/**
 * Cor por tipo de anúncio (categoria). Fixa e igual em todos os temas:
 * a cor identifica o tipo de obra no mapa, nos pins, nas etiquetas de
 * preço e no carrossel. Hues bem separados e nenhum laranja (o laranja
 * é a cor da marca).
 */
export const CATEGORY_COLORS = {
  "Pintura":              "#8B5CF6", // violeta
  "Eletricidade":         "#EAB308", // amarelo
  "Canalização":          "#2563EB", // azul
  "Alvenaria":            "#78716C", // pedra
  "Azulejista":           "#0D9488", // verde-água
  "Ladrilhador":          "#0D9488",
  "Carpintaria":          "#92400E", // castanho madeira
  "Climatização":         "#06B6D4", // ciano
  "Serralharia":          "#475569", // aço
  "Jardinagem":           "#16A34A", // verde
  "Impermeabilizador":    "#4F46E5", // índigo
  "Estucador":            "#DB2777", // rosa
  "Montador de Andaimes": "#DC2626", // vermelho
  "Isolamentos":          "#C026D3", // fúcsia
  "Pavimentos":           "#65A30D", // lima
  "Telhados":             "#9F1239", // bordô
};
export const CATEGORY_DEFAULT_COLOR = "#6B7280";
export const categoryColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_DEFAULT_COLOR;
