import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('security')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({
    summary: 'Le serveur répond. Ne touche pas la base, pour ne pas la tenir éveillée.',
  })
  @ApiResponse({ status: 200, description: 'Le serveur est vivant' })
  live(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Le serveur répond et sa base est joignable' })
  @ApiResponse({ status: 200, description: 'Prêt à servir' })
  @ApiResponse({ status: 503, description: 'La base ne répond pas' })
  async ready(): Promise<{ status: 'ok'; uptime: number }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Base de données injoignable');
    }
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}
