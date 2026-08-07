// ============================================================
// Types — edusen_mobile
// ============================================================

export interface LoginResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  refreshExpiresIn: number;
  passwordChangeRequired: boolean;
}

export interface MeResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: string | null;
  photoUrl: string | null;
  telephone: string | null;
}

export interface Classe {
  id: string;
  nom: string;
}

export interface Parent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  telephone: string | null;
  email: string | null;
  lienParente: string | null;
}

export interface Eleve {
  id: string;
  firstName: string | null;
  lastName: string | null;
  matricule: string | null;
  photoUrl: string | null;
  email: string | null;
  telephone: string | null;
  role: string;
  eleveClasse: Classe | null;
  elevParents?: Array<{ parent: Parent }>;
}

export interface ElevePaged {
  data: Eleve[];
  total: number;
  page: number;
  size: number;
}

export interface DetteDetail {
  eleveId: string;
  montant: number;
  anneeScolaire: string | null;
  trimestre: string | null;
  description: string | null;
  reference: string | null;
  statut: string;
  createdAt: string;
}

export interface DetteSummary {
  eleve: {
    id: string;
    nom: string;
    matricule: string | null;
  };
  totalDettes: number;
  nombreDettes: number;
  dettes: DetteDetail[];
}

export interface InscriptionInfo {
  id: string;
  statut: string;
  classeId: string;
  classe?: Classe;
}

/** Cached student entry for offline mode */
export interface CachedStudent {
  eleve: Eleve;
  dettes: DetteSummary | null;
  cachedAt: number;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Scanner: undefined;
  Result: { studentId: string; cardToken?: string };
};

export type TabParamList = {
  ScannerTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};
