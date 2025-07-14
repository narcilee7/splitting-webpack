export interface Configuration {
  entry: string | string[] | Record<string, string>;
  output: {
    path: string;
    filename: string;
    publicPath?: string;
    clean?: boolean;
  };
  mode: 'development' | 'production';
  context?: string;
  resolve?: {
    extensions?: string[];
    alias?: Record<string, string>;
    modules?: string[];
    mainFiles?: string[];
    mainFields?: string[];
  };
  module?: {
    rules?: RuleSetRule[];
  };
  plugins?: Plugin[];
  devServer?: {
    port?: number;
    hot?: boolean;
    open?: boolean;
  };
  cache?: boolean | {
    type: 'memory' | 'filesystem';
    cacheDirectory?: string;
  };
  devtool?: string | false;
  target?: string;
  externals?: Record<string, string>;
}

export interface RuleSetRule {
  test?: RegExp;
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  use?: RuleSetRule | RuleSetRule[];
  loader?: string;
  options?: any;
}

export interface RuleSetUse {
  loader: string;
  options?: any
}

export interface Plugin {
  apply(compiler: any): void;
}

export interface LoaderContext {
  resourcePath: string;
  query: string;
  callback: (error: Error | null, content?: string, sourceMap?: any) => void;
  async: (error: Error | null, content?: string, sourceMap?: any) => void;
  cacheable: (flag?: boolean) => void;
  addDependency: (file: string) => void;
  emitFile: (name: string, content: string, sourceMap?: any) => void;
}
