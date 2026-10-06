import { DomainError } from '../../common/domain/domain-error';

const ID_PATTERN = /^webgpu:[A-Za-z0-9._-]+$/;

export interface AiModelState {
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
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    id: string;
    label: string;
    description: string;
    vramMb: number;
    position: number;
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
  }): void {
    if (changes.label !== undefined) this.label = changes.label.trim();
    if (changes.description !== undefined) this.description = changes.description.trim();
    if (changes.vramMb !== undefined) {
      if (changes.vramMb <= 0) throw new DomainError('La mémoire requise doit être positive');
      this.vramMb = changes.vramMb;
    }
    if (changes.position !== undefined) this.position = changes.position;
    if (changes.enabled !== undefined) this.enabled = changes.enabled;
  }

  refreshWeights(): void {
    this.currentRevision += 1;
  }
}
