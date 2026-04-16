export interface Candidato {
  nombre: string;
  partido: string;
  codigo: number;
  votos: number;
  porcentaje: number;
  porcentajeEmitidos: number;
}

export interface Snapshot {
  timestamp: number;
  fechaOnpe: number;
  actasContabilizadas: number;
  totalActas: number;
  contabilizadas: number;
  totalVotosValidos: number;
  totalVotosEmitidos: number;
  candidatos: Candidato[];
}

export type History = Snapshot[];
