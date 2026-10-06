import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('security')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: "Vivacité du serveur et de sa base, pour l'orchestrateur" })
  @ApiResponse({ status: 200, description: 'Le serveur répond et la base est joignable' })
  @ApiResponse({ status: 503, description: 'La base ne répond pas' })
  async check(): Promise<{ status: 'ok'; uptime: number }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Base de données injoignable');
    }
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}
