/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck

import type {
  RouteRecordInfo,
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,
} from 'vue-router'
import type { _ExtractParamParserType } from 'vue-router/experimental';

declare module 'vue-router' {
  interface TypesConfig {
    _ParamParsers: {};
    RouteNamedMap: import('vue-router/auto-routes').RouteNamedMap;
    _RouteFileInfoMap: import('vue-router/auto-routes')._RouteFileInfoMap;
  }
}

declare module 'vue-router/auto-routes' {
  export interface RouteNamedMap {}

  export interface _RouteFileInfoMap {}

  export type _RouteNamesForFilePath<FilePath extends string> =
    _RouteFileInfoMap extends Record<FilePath, infer Info> ? Info['routes'] : keyof RouteNamedMap;
}

export {};
