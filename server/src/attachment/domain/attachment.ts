import { DomainError } from '../../common/domain/domain-error';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES_PER_MESSAGE = 5;

const NATIVE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const TEXT_EXTENSIONS =
  /\.(txt|md|csv|json|xml|ya?ml|html?|css|scss|js|jsx|ts|tsx|vue|py|java|kt|c|h|cpp|cs|go|rs|rb|php|swift|sql|sh|ps1|env|ini|toml|log)$/i;

export interface UploadedFile {
  name: string;
  mimeType: string;
  size: number;
  data: Buffer;
}

export interface AttachmentState {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: Buffer;
  userId: string;
  messageId: string | null;
  createdAt: Date;
}

export class Attachment {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly mimeType: string,
    readonly size: number,
    readonly data: Buffer,
    readonly userId: string,
    public messageId: string | null,
    readonly createdAt: Date,
  ) {}

  static accept(userId: string, file: UploadedFile): Attachment {
    if (file.size > MAX_FILE_SIZE) throw new DomainError('Le fichier dépasse 10 Mo');
    return new Attachment(
      '',
      file.name,
      Attachment.readableType(file),
      file.size,
      file.data,
      userId,
      null,
      new Date(),
    );
  }

  static rehydrate(state: AttachmentState): Attachment {
    return new Attachment(
      state.id,
      state.name,
      state.mimeType,
      state.size,
      state.data,
      state.userId,
      state.messageId,
      state.createdAt,
    );
  }

  static assertBatchSize(count: number): void {
    if (count > MAX_FILES_PER_MESSAGE) {
      throw new DomainError('5 fichiers maximum par message');
    }
  }

  get isReadableByAi(): boolean {
    return !this.mimeType.startsWith('image/') && this.mimeType !== 'application/pdf';
  }

  belongsTo(userId: string | undefined): boolean {
    return !!userId && this.userId === userId;
  }

  attachTo(messageId: string): void {
    this.messageId = messageId;
  }

  private static readableType(file: UploadedFile): string {
    if (NATIVE_TYPES.has(file.mimeType)) return file.mimeType;
    if (file.mimeType.startsWith('text/') || TEXT_EXTENSIONS.test(file.name)) {
      return 'text/plain';
    }
    throw new DomainError(
      'Type de fichier non pris en charge : images, PDF ou fichiers texte uniquement',
    );
  }
}
