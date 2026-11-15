/** Dados editoriais resolvidos no servidor; sem dependência do motor no browser. */
export interface ArchetypeSummary {
  numero: number;
  nome: string;
  essencia: string;
  descricao: string;
  expressaoPositiva: string[];
  expressaoSombra: string[];
}
