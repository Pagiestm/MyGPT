import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: getDataSourceToken(), useValue: dataSource }],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();
    controller = module.get(HealthController);
  });

  it('répond sans réveiller la base, pour qu’un ping régulier ne la tienne pas éveillée', () => {
    expect(controller.live()).toMatchObject({ status: 'ok' });
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('answers only once the database has actually replied', async () => {
    await expect(controller.ready()).resolves.toMatchObject({ status: 'ok' });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('reports itself unavailable rather than healthy when the database is down', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
  });

  it('never leaks the database error to the caller', async () => {
    dataSource.query.mockRejectedValue(new Error('password authentication failed for postgres'));

    await expect(controller.ready()).rejects.toThrow('Base de données injoignable');
  });
});
