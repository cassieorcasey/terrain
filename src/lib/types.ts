export type Status = 'aktif' | 'dicoba' | 'arsip';
export type Role = 'utama' | 'alternatif' | 'tugas_kompleks';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  row: 0 | 1;
  col: 0 | 1;
}

export interface Tool {
  id: string;
  name: string;
  url: string | null;
  note: string | null;
  status: Status;
}

export interface Placement {
  toolId: string;
  categoryId: string;
  group: string | null;
  displayName: string | null;
  description: string | null;
  workflows: string[];
  sort: number;
}

export interface Model {
  id: string;
  family: string;
  version: string;
  providerId: string;
  status: Status;
  sort: number;
}

export interface NeedTarget {
  needId: string;
  modelId: string | null;
  toolId: string | null;
  role: Role;
  note: string | null;
  sort: number;
}

export interface Need {
  id: string;
  name: string;
  sort: number;
}

export interface Stack {
  categories: Category[];
  tools: Tool[];
  placements: Placement[];
  models: Model[];
  needs: Need[];
  targets: NeedTarget[];
}

export type NodeKind = 'tool' | 'model' | 'need';

export const ROLE_LABEL: Record<Role, string> = {
  utama: 'Utama',
  alternatif: 'Alternatif',
  tugas_kompleks: 'Untuk tugas kompleks',
};

export const STATUS_LABEL: Record<Status, string> = {
  aktif: 'Aktif',
  dicoba: 'Dicoba',
  arsip: 'Arsip',
};
