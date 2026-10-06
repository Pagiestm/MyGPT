import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source.options';

export default new DataSource(dataSourceOptions);
