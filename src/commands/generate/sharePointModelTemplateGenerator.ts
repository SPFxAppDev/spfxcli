import spfxAppDevUtility from '@spfxappdev/utility';
import { Configuration } from '@azure/msal-node';
import { SPFI, spfi } from '@pnp/sp';
import { graphfi, GraphFI } from '@pnp/graph';
import '@pnp/sp/webs/index.js';
import '@pnp/sp/lists/index.js';
import '@pnp/sp/fields/index.js';
import '@pnp/graph/sites/index.js';
import '@pnp/graph/lists/index.js';
import '@pnp/graph/columns/index.js';
import { PublicClientApplication, ConfidentialClientApplication } from '@azure/msal-node';
import { NodeFetch, SPDefault, GraphDefault } from '@pnp/nodejs';
import chalk from 'chalk';
import { IFieldInfo } from '@pnp/sp/fields/index.js';
import { GraphColumnResolver } from './graphColumnResolver.js';
import { SharePointColumnResolver } from './sharePointColumnResolver.js';

const { replaceTpl, replaceNonAlphanumeric, isNullOrEmpty, isset, allAreNullOrEmpty, Uri } =
  spfxAppDevUtility;

export interface ISharePointModelOptions {
  webUrl: string;
  listUrl: string;
  listName: string;
  authConfiguration: Configuration;
  includeHiddenFields: string;
  selectFields?: string;
}

export const NOT_SUPPORTED_FIELDS = [
  '_EditMenuTableStart',
  '_EditMenuTableStart2',
  '_EditMenuTableEnd',
  '_ComplianceFlags',
  '_ComplianceTag',
  '_ComplianceTagWrittenTime',
  '_ComplianceTagUserId',
  'LinkFilenameNoMenu',
  'LinkFilename',
  'LinkFilename2',
  'LinkTitleNoMenu',
  'LinkTitle',
  'LinkTitle2',
  'AppAuthor',
  'AppEditor',
  '_IsRecord',
  '_UIVersionString',
  '_ColorTag',
];

export type TSFieldTemplate = {
  propertyTemplate: string;
  mapperTemplate: string;
};

export const FieldTypeTemplate: Record<string, TSFieldTemplate> = {
  invalid: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  integer: {
    propertyTemplate: '{ModelPropertyName}: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  text: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  note: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  datetime: {
    propertyTemplate: '{ModelPropertyName}: Date;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', type: Date, {AdditionalMapperProperties} })`,
  },
  counter: {
    propertyTemplate: '{ModelPropertyName}: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  choice: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  lookup: {
    propertyTemplate: '{ModelPropertyName}Id: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}Id', {AdditionalMapperProperties} })`,
  },
  boolean: {
    propertyTemplate: '{ModelPropertyName}: boolean;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  number: {
    propertyTemplate: '{ModelPropertyName}: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  currency: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  url: {
    propertyTemplate: '{ModelPropertyName}: UrlFieldValue;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', type: UrlFieldValue, {AdditionalMapperProperties} })`,
  },
  computed: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  threading: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  guid: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  multichoice: {
    propertyTemplate: '{ModelPropertyName}: string[];',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  gridchoice: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  calculated: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  file: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  attachments: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  user: {
    propertyTemplate: '{ModelPropertyName}Id: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}Id', {AdditionalMapperProperties} })`,
  },
  recurrence: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  crossprojectLink: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  modstat: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  error: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  contenttypeid: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  pageseparator: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  threadindex: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  workflowstatus: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  alldayevent: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  workfloweventtype: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  geolocation: {
    propertyTemplate: '{ModelPropertyName}: GeoLocationFieldValue;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', type: GeoLocationFieldValue, {AdditionalMapperProperties} })`,
  },
  outcomechoice: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  maxitems: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  // special cases
  taxonomyfieldtype: {
    propertyTemplate: '{ModelPropertyName}: TaxonomyFieldValue;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', type: TaxonomyFieldValue, {AdditionalMapperProperties} })`,
  },
  taxonomyfieldtypemulti: {
    propertyTemplate: '{ModelPropertyName}: TaxonomyFieldValue[];',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', type: TaxonomyFieldValue, {AdditionalMapperProperties} })`,
  },
  lookupmulti: {
    propertyTemplate: '{ModelPropertyName}Id: number[];',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}Id', {AdditionalMapperProperties} })`,
  },
  usermulti: {
    propertyTemplate: '{ModelPropertyName}Id: number[];',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}Id', {AdditionalMapperProperties} })`,
  },
  location: {
    propertyTemplate: '{ModelPropertyName}: string;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  likes: {
    propertyTemplate: '{ModelPropertyName}: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  averagerating: {
    propertyTemplate: '{ModelPropertyName}: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  ratingcount: {
    propertyTemplate: '{ModelPropertyName}: number;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
  thumbnail: {
    propertyTemplate: '{ModelPropertyName}: any;',
    mapperTemplate: `@mapper({ nameOrPath: '{EntityPropertyName}', {AdditionalMapperProperties} })`,
  },
};

export type SPFieldModelInformation = {
  Title: string;
  StaticName: string;
  FieldType: number;
  Type: string;
  Id: string;
  InternalName: string;
  EntityPropertyName: string;
  IsReadOnlyField: boolean;
  ModelPropertyName: string;
  ModelPropertyType: string;
  ResolvedTemplate?: TSFieldTemplate;
};

export type TemplateInformation = {
  fields: SPFieldModelInformation[];
  hasLookup: boolean;
  hasTaxonomy: boolean;
  hasUrl: boolean;
  hasGeoLocation: boolean;
};

export type ModelTemplate = {
  classImports: string;
  interfaceImports: string;
  classContent: string;
  interfaceContent: string;
};

export class SharePointModelTemplateGenerator {
  constructor(private readonly options: ISharePointModelOptions) {}

  public static get EmptyModel(): ModelTemplate {
    const returnValue: ModelTemplate = {
      classImports: '',
      interfaceImports: '',
      classContent: '',
      interfaceContent: '',
    };

    return { ...returnValue };
  }

  public async generate(): Promise<ModelTemplate> {
    const returnValue: ModelTemplate = SharePointModelTemplateGenerator.EmptyModel;

    if (
      isNullOrEmpty(this.options.authConfiguration) ||
      isNullOrEmpty(this.options.authConfiguration.auth) ||
      isNullOrEmpty(this.options.authConfiguration.auth.clientId)
    ) {
      return returnValue;
    }

    const listUrl = this.options.listUrl;
    const listTitle = this.options.listName;

    if (allAreNullOrEmpty(listUrl, listTitle)) {
      return returnValue;
    }

    const useGraphApi: boolean = !isNullOrEmpty(this.options.authConfiguration.auth.clientSecret);

    if (useGraphApi) {
      const resolver = new GraphColumnResolver(this.options);
      return await resolver.generate();
    }

    const resolver = new SharePointColumnResolver(this.options);
    return await resolver.generate();
  }
}
