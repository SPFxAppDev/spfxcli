import spfxAppDevUtility from '@spfxappdev/utility';
import { SPFI, spfi } from '@pnp/sp';
import '@pnp/sp/webs/index.js';
import '@pnp/sp/lists/index.js';
import '@pnp/sp/fields/index.js';
import { PublicClientApplication } from '@azure/msal-node';
import { NodeFetch, SPDefault } from '@pnp/nodejs';
import chalk from 'chalk';
import { IFieldInfo } from '@pnp/sp/fields/index.js';
import {
  FieldTypeTemplate,
  ISharePointModelOptions,
  ModelTemplate,
  NOT_SUPPORTED_FIELDS,
  SharePointModelTemplateGenerator,
  SPFieldModelInformation,
  TemplateInformation,
} from './sharePointModelTemplateGenerator.js';

const { replaceTpl, replaceNonAlphanumeric, isNullOrEmpty, isset, allAreNullOrEmpty, Uri } =
  spfxAppDevUtility;

export class SharePointColumnResolver {
  constructor(private readonly options: ISharePointModelOptions) {}

  public async generate(): Promise<ModelTemplate> {
    const returnValue: ModelTemplate = SharePointModelTemplateGenerator.EmptyModel;

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
    const clientApp: PublicClientApplication = new PublicClientApplication(
      this.options.authConfiguration,
    );

    const scopes = [`${new URL(this.options.webUrl).origin}/.default`];

    return spfi(this.options.webUrl).using(NodeFetch(), SPDefault(), (instance) => {
      instance.on.auth(async function (url, init) {
        let result = null;
        const accounts = await clientApp.getTokenCache().getAllAccounts();

        if (accounts.length > 0) {
          try {
            result = await clientApp.acquireTokenSilent({ account: accounts[0], scopes });
          } catch (e) {}
        }

        if (!result) {
          result = await clientApp.acquireTokenByDeviceCode({
            deviceCodeCallback: (res) => {
              console.log(chalk.yellow('\n#################################################'));
              console.log(res.message);
              console.log(chalk.yellow('\n#################################################'));
            },
            scopes,
          });
        }

        const accessToken = result.accessToken;

        if (!init.headers) {
          init.headers = {};
        }

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
