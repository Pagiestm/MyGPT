import { MigrationInterface, QueryRunner } from 'typeorm';

const MODELS = [
  {
    id: 'webgpu:SmolLM2-360M-Instruct-q4f16_1-MLC',
    label: 'SmolLM2 360M',
    description: 'Pour téléphone, GPU compatible f16',
    vramMb: 376,
    parameters: '360 millions',
    strengths: ['Tient sur un téléphone', 'Téléchargement très rapide'],
    limitations: [
      'Surtout en anglais',
      'Raisonnement très limité',
      'Erreurs factuelles fréquentes',
    ],
    contextWindow: 4096,
    requiredFeatures: ['shader-f16'],
  },
  {
    id: 'webgpu:SmolLM2-360M-Instruct-q4f32_1-MLC',
    label: 'SmolLM2 360M (sans f16)',
    description: 'Pour téléphone, sans exigence GPU',
    vramMb: 580,
    parameters: '360 millions',
    strengths: ['Tient sur un téléphone', 'Aucune exigence GPU particulière'],
    limitations: [
      'Surtout en anglais',
      'Raisonnement très limité',
      'Erreurs factuelles fréquentes',
    ],
    contextWindow: 4096,
    requiredFeatures: [],
  },
  {
    id: 'webgpu:Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B',
    description: 'Le plus léger à comprendre le français',
    vramMb: 879,
    parameters: '1 milliard',
    strengths: ['Comprend le français', 'Démarre vite', 'Tient sans GPU dédié'],
    limitations: ['Raisonnement limité', 'Erreurs factuelles fréquentes'],
    contextWindow: 4096,
    requiredFeatures: [],
  },
];

function array(values: string[]): string {
  return `{${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(',')}}`;
}

export class LightweightModels1791460000000 implements MigrationInterface {
  name = 'LightweightModels1791460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = (await queryRunner.query(
      `SELECT COUNT(*)::int AS count FROM "ai_models"`,
    )) as [{ count: number }];
    if (!count) return;

    await queryRunner.query(`UPDATE "ai_models" SET "position" = "position" + $1`, [MODELS.length]);

    for (const [offset, model] of MODELS.entries()) {
      await queryRunner.query(
        `INSERT INTO "ai_models" ("id", "label", "description", "vramMb", "position", "parameters", "strengths", "limitations", "contextWindow", "lowResource", "requiredFeatures")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
         ON CONFLICT ("id") DO NOTHING`,
        [
          model.id,
          model.label,
          model.description,
          model.vramMb,
          offset,
          model.parameters,
          array(model.strengths),
          array(model.limitations),
          model.contextWindow,
          array(model.requiredFeatures),
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "ai_models" WHERE "id" = ANY($1)`, [
      array(MODELS.map((model) => model.id)),
    ]);
  }
}
