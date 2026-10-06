import { DomainError } from '../../common/domain/domain-error';

const ID_PATTERN = /^webgpu:[A-Za-z0-9._-]+$/;
const MAX_TRAITS = 6;
const MAX_TRAIT_LENGTH = 80;

export interface AiModelProfile {
  parameters: string | null;
  strengths: string[];
  limitations: string[];
  contextWindow: number | null;
  lowResource: boolean;
  requiredFeatures: string[];
}

export interface AiModelState extends AiModelProfile {
  id: string;
  label: string;
  description: string;
  vramMb: number;
  position: number;
  enabled: boolean;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AiModel {
  private constructor(
    readonly id: string,
    public label: string,
    public description: string,
    public vramMb: number,
    public position: number,
    public enabled: boolean,
    private currentRevision: number,
    public parameters: string | null,
    public strengths: string[],
    public limitations: string[],
    public contextWindow: number | null,
    public lowResource: boolean,
    public requiredFeatures: string[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    id: string;
    label: string;
    description: string;
    vramMb: number;
    position: number;
    parameters?: string | null;
    strengths?: string[];
    limitations?: string[];
    contextWindow?: number | null;
    lowResource?: boolean;
    requiredFeatures?: string[];
  }): AiModel {
    if (!ID_PATTERN.test(input.id)) {
      throw new DomainError('Identifiant attendu sous la forme « webgpu:<modèle MLC> »');
    }
    if (input.vramMb <= 0) {
      throw new DomainError('La mémoire requise doit être positive');
    }
    const now = new Date();
    return new AiModel(
      input.id,
      input.label.trim(),
      input.description.trim(),
      input.vramMb,
      input.position,
      true,
      1,
      input.parameters?.trim() || null,
      AiModel.cleanTraits(input.strengths),
      AiModel.cleanTraits(input.limitations),
      AiModel.cleanContextWindow(input.contextWindow),
      input.lowResource ?? false,
      AiModel.cleanTraits(input.requiredFeatures),
      now,
      now,
    );
  }

  static rehydrate(state: AiModelState): AiModel {
    return new AiModel(
      state.id,
      state.label,
      state.description,
      state.vramMb,
      state.position,
      state.enabled,
      state.revision,
      state.parameters,
      state.strengths,
      state.limitations,
      state.contextWindow,
      state.lowResource,
      state.requiredFeatures,
      state.createdAt,
      state.updatedAt,
    );
  }

  get revision(): number {
    return this.currentRevision;
  }

  describeAs(changes: {
    label?: string;
    description?: string;
    vramMb?: number;
    position?: number;
    enabled?: boolean;
    parameters?: string | null;
    strengths?: string[];
    limitations?: string[];
    contextWindow?: number | null;
    lowResource?: boolean;
    requiredFeatures?: string[];
  }): void {
    if (changes.label !== undefined) this.label = changes.label.trim();
    if (changes.description !== undefined) this.description = changes.description.trim();
    if (changes.vramMb !== undefined) {
      if (changes.vramMb <= 0) throw new DomainError('La mémoire requise doit être positive');
      this.vramMb = changes.vramMb;
    }
    if (changes.position !== undefined) this.position = changes.position;
    if (changes.enabled !== undefined) this.enabled = changes.enabled;
    if (changes.parameters !== undefined) this.parameters = changes.parameters?.trim() || null;
    if (changes.strengths !== undefined) this.strengths = AiModel.cleanTraits(changes.strengths);
    if (changes.limitations !== undefined) {
      this.limitations = AiModel.cleanTraits(changes.limitations);
    }
    if (changes.contextWindow !== undefined) {
      this.contextWindow = AiModel.cleanContextWindow(changes.contextWindow);
    }
    if (changes.lowResource !== undefined) this.lowResource = changes.lowResource;
    if (changes.requiredFeatures !== undefined) {
      this.requiredFeatures = AiModel.cleanTraits(changes.requiredFeatures);
    }
  }

  refreshWeights(): void {
    this.currentRevision += 1;
  }

  private static cleanTraits(traits: string[] | undefined): string[] {
    const cleaned = (traits ?? []).map((trait) => trait.trim()).filter(Boolean);
    if (cleaned.length > MAX_TRAITS) {
      throw new DomainError(`${MAX_TRAITS} éléments au maximum`);
    }
    if (cleaned.some((trait) => trait.length > MAX_TRAIT_LENGTH)) {
      throw new DomainError(`Chaque élément fait ${MAX_TRAIT_LENGTH} caractères au maximum`);
    }
    return cleaned;
  }

  private static cleanContextWindow(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (value <= 0) throw new DomainError('La fenêtre de contexte doit être positive');
    return value;
  }
}
