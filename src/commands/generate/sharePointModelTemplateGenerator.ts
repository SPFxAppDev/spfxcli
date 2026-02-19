import spfxAppDevUtility from '@spfxappdev/utility';
import { Configuration } from '@azure/msal-node';
import { SPFI, spfi } from '@pnp/sp';
import '@pnp/sp/webs/index.js';
import '@pnp/sp/lists/index.js';
import '@pnp/sp/fields/index.js';
import { IWeb } from '@pnp/sp/webs/types.js';
import { PublicClientApplication, ConfidentialClientApplication } from '@azure/msal-node';
import { NodeFetch, SPDefault } from '@pnp/nodejs';
import chalk from 'chalk';
import { IFieldInfo } from '@pnp/sp/fields/index.js';

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

const NOT_SUPPORTED_FIELDS = [
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
  Id: number;
  InternalName: string;
  EntityPropertyName: string;
  IsReadOnlyField: boolean;
  ModelPropertyName: string;
  ModelPropertyType: string;
  ResolvedTemplate?: TSFieldTemplate;
};

type TemplateInformation = {
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
      isNullOrEmpty(this.options.authConfiguration.auth.clientId)
    ) {
      return returnValue;
    }

    const templateInfo: TemplateInformation = {
      fields: [],
      hasLookup: false,
      hasTaxonomy: false,
      hasUrl: false,
      hasGeoLocation: false,
    };

    const listUrl = this.options.listUrl;
    const listTitle = this.options.listName;

    if (allAreNullOrEmpty(listUrl, listTitle)) {
      return returnValue;
    }

    const sp = await this.getSPFI();

    const includeHiddenFields = this.options.includeHiddenFields || false;
    let filter = 'Hidden eq false';

    if (includeHiddenFields) {
      filter += ' or Hidden eq true';
    }

    try {
      let allFields: IFieldInfo[];
      if (!isNullOrEmpty(listUrl)) {
        const spListUri = new Uri(this.options.webUrl);
        spListUri.Combine(listUrl);
        allFields = await (sp as any).web.getList(spListUri.Path).fields.filter(filter)();
      } else {
        allFields = await (sp as any).web.lists.getByTitle(listTitle).fields.filter(filter)();
      }

      const classMember: string[] = [];
      const interfaceMember: string[] = [];
      const classImports: string[] = [];
      const interfaceImports: string[] = [];

      allFields.forEach((field: IFieldInfo) => {
        if (NOT_SUPPORTED_FIELDS.indexOf(field.StaticName) !== -1) {
          return;
        }

        let isSystemDocsListLookup = field.SchemaXml.indexOf('List="Docs"') !== -1;
        let isLookupListEmpty = !(field as any).LookupList;
        let isLookup = field.FieldTypeKind === 7;

        if (isLookup && isLookupListEmpty && isSystemDocsListLookup && field.Hidden) {
          return;
        }

        const fieldInfo: SPFieldModelInformation = this.getSPFieldModelInformation(field);

        templateInfo.hasLookup = templateInfo.hasLookup || fieldInfo.FieldType === 7;
        templateInfo.hasUrl = templateInfo.hasUrl || fieldInfo.FieldType === 11;
        templateInfo.hasTaxonomy =
          templateInfo.hasTaxonomy ||
          fieldInfo.Type.Equals('TaxonomyFieldType') ||
          fieldInfo.Type.Equals('TaxonomyFieldTypeMulti');
        templateInfo.hasGeoLocation = templateInfo.hasGeoLocation || fieldInfo.FieldType === 31;

        templateInfo.fields.push(fieldInfo);

        classMember.push(fieldInfo.ResolvedTemplate.mapperTemplate);
        classMember.push('\n\t');
        classMember.push(`public ${fieldInfo.ResolvedTemplate.propertyTemplate}`);
        classMember.push('\n');
        classMember.push('\n\t');

        interfaceMember.push(fieldInfo.ResolvedTemplate.propertyTemplate);
        interfaceMember.push('\n\t');
      });

      if (isNullOrEmpty(templateInfo.fields)) {
        return returnValue;
      }

      returnValue.classContent = classMember.join('');
      returnValue.interfaceContent = interfaceMember.join('');

      if (templateInfo.hasUrl) {
        classImports.push('UrlFieldValue');
        interfaceImports.push('UrlFieldValue');
      }

      if (templateInfo.hasTaxonomy) {
        classImports.push('TaxonomyFieldValue');
        interfaceImports.push('TaxonomyFieldValue');
      }

      if (templateInfo.hasGeoLocation) {
        classImports.push('GeoLocationFieldValue');
        interfaceImports.push('GeoLocationFieldValue');
      }

      returnValue.classImports += `import { mapper } from '@spfxappdev/mapper';`;

      if (!isNullOrEmpty(classImports)) {
        returnValue.classImports += `\nimport { ${classImports.join(', ')} } from './';`;
      }

      if (!isNullOrEmpty(interfaceImports)) {
        returnValue.interfaceImports += `\nimport { ${interfaceImports.join(', ')} } from '../';`;
      }

      return returnValue;
    } catch (error) {
      console.error(chalk.red(`An error occurred\n`), error);
      return SharePointModelTemplateGenerator.EmptyModel;
    }
  }

  private getSPFieldModelInformation(field: any): SPFieldModelInformation {
    const fieldInfo: SPFieldModelInformation = {
      Title: field.Title,
      StaticName: field.StaticName,
      FieldType: field.FieldTypeKind,
      Type: field.TypeAsString,
      Id: field.Id,
      InternalName: field.InternalName,
      EntityPropertyName: field.EntityPropertyName,
      IsReadOnlyField: field.ReadOnlyField,
      ModelPropertyName: field.Title,
      ModelPropertyType: 'any',
      ResolvedTemplate: {
        propertyTemplate: '',
        mapperTemplate: '',
      },
    };

    let generatedName = fieldInfo.ModelPropertyName.slice();

    if (generatedName === generatedName.toUpperCase()) {
      generatedName = generatedName.toLowerCase();
    }

    generatedName = replaceNonAlphanumeric(generatedName, ' ');

    //Make camelCase
    generatedName = generatedName.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    generatedName = generatedName[0].toLowerCase() + generatedName.substring(1);

    fieldInfo.ModelPropertyName = generatedName;

    const modelPropertyType =
      isset(fieldInfo.Type) && isset(FieldTypeTemplate[fieldInfo.Type.toLocaleLowerCase()])
        ? FieldTypeTemplate[fieldInfo.Type.toLocaleLowerCase()]
        : FieldTypeTemplate['invalid'];

    if (!isset(modelPropertyType)) {
      return fieldInfo;
    }

    fieldInfo.ResolvedTemplate = { ...modelPropertyType };

    const mapperData: any = {
      EntityPropertyName: fieldInfo.EntityPropertyName,
      AdditionalMapperProperties: '',
    };

    if (fieldInfo.IsReadOnlyField) {
      mapperData.AdditionalMapperProperties = 'toClassOnly: true';
    }

    fieldInfo.ResolvedTemplate.mapperTemplate = replaceTpl(
      modelPropertyType.mapperTemplate,
      mapperData,
    );

    fieldInfo.ResolvedTemplate.propertyTemplate = replaceTpl(modelPropertyType.propertyTemplate, {
      ModelPropertyName: fieldInfo.ModelPropertyName,
    });

    return fieldInfo;
  }

  private async getSPFI(): Promise<SPFI> {
    let clientApp: PublicClientApplication | ConfidentialClientApplication;

    const useClientCredentialFlow = !isNullOrEmpty(
      this.options.authConfiguration.auth.clientSecret,
    );
    if (useClientCredentialFlow) {
      clientApp = new ConfidentialClientApplication(this.options.authConfiguration);
    } else {
      clientApp = new PublicClientApplication(this.options.authConfiguration);
    }

    const scopes = [`${new URL(this.options.webUrl).origin}/.default`];

    return spfi(this.options.webUrl).using(NodeFetch(), SPDefault(), (instance) => {
      instance.on.auth(async function (url, init) {
        let result = null;

        if (useClientCredentialFlow) {
          result = await (
            clientApp as ConfidentialClientApplication
          ).acquireTokenByClientCredential({
            scopes: scopes,
          });
        } else {
          const accounts = await clientApp.getTokenCache().getAllAccounts();

          if (accounts.length > 0) {
            try {
              result = await clientApp.acquireTokenSilent({ account: accounts[0], scopes });
            } catch (e) {}
          }

          if (!result) {
            result = await (clientApp as PublicClientApplication).acquireTokenByDeviceCode({
              deviceCodeCallback: (res) => {
                console.log(chalk.yellow('\n#################################################'));
                console.log(res.message);
                console.log(chalk.yellow('\n#################################################'));
              },
              scopes,
            });
          }
        }

        const accessToken = result.accessToken;

        if (!init.headers) {
          init.headers = {};
        }

        console.log('SSC accesstoken', accessToken);

        Object.assign(init.headers, {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json;odata=verbose',
        });

        return [url, init];
      });

      return instance;
    });
  }
}
