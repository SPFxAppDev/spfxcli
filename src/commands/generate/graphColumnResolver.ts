import spfxAppDevUtility from '@spfxappdev/utility';
import { graphfi, GraphFI } from '@pnp/graph';
import '@pnp/graph/sites/index.js';
import '@pnp/graph/lists/index.js';
import '@pnp/graph/columns/index.js';
import { PublicClientApplication, ConfidentialClientApplication } from '@azure/msal-node';
import { NodeFetch, GraphDefault } from '@pnp/nodejs';
import chalk from 'chalk';
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

type GraphColumn = {
  boolean?: {};
  calculated?: {
    format: string;
    formula: string;
    outputType: string;
  };
  choice?: {
    allowTextEntry: boolean;
    choices: string[];
    displayAs: string;
  };
  columnGroup: string;
  currency?: {
    locale: string;
  };
  dateTime?: {
    displayAs: string;
    format: string;
  };
  defaultValue?: {
    formula: string;
    value: string;
  };
  description: string;
  displayName: string;
  enforceUniqueValues: boolean;
  geolocation?: {};
  hidden: boolean;
  hyperlinkOrPicture?: {
    isPicture: boolean;
  };
  id: string;
  indexed: boolean;
  lookup?: {
    allowMultipleValues: boolean;
    allowUnlimitedLength: boolean;
    columnName: string;
    listId: string;
    primaryLookupColumnId: string;
  };
  name: string;
  number?: {
    decimalPlaces: string;
    displayAs: string;
    maximum: number;
    minimum: number;
  };
  personOrGroup?: {
    allowMultipleSelection: boolean;
    displayAs: string;
    chooseFromType: string;
  };
  readOnly: boolean;
  required: boolean;
  propagateChanges: boolean;
  sourceContentType?: {
    id: string;
    name: string;
  };
  term?: {
    allowMultipleValues: boolean;
    showFullyQualifiedName: boolean;
  };
  text?: {
    allowMultipleLines: boolean;
    appendChangesToExistingText: boolean;
    linesForEditing: number;
    maxLength: number;
    textType: string;
  };
  thumbnail?: {};
};

const defaultSPTextFields: string[] = [
  'FileLeafRef',
  'ContentType',
  'DocIcon',
  'FileSizeDisplay',
  'Edit',
];
const defaultSPNumberFields: string[] = ['ID'];
const defaultSPUrlFields: string[] = ['BannerImageUrl'];

export class GraphColumnResolver {
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

    const graph = await this.getGraphFI();

    const includeHiddenFields = this.options.includeHiddenFields || false;
    let filter = 'hidden eq false';

    if (includeHiddenFields) {
      filter += ' or hidden eq true';
    }

    try {
      const siteUrl = new URL(this.options.webUrl);
      const site = await (graph as any).sites.getByUrl(siteUrl.host, siteUrl.pathname);
      const siteInfo = await site();
      const siteId = siteInfo.id.split(',')[1];
      const siteLists = await (graph as any).sites
        .getById(siteId)
        .lists.select('system,displayName,webUrl,id')();

      let allFields: GraphColumn[] = [];
      let list: any;
      if (!isNullOrEmpty(listUrl)) {
        const spListUri = new Uri(this.options.webUrl);
        spListUri.Combine(listUrl);

        list = siteLists.FirstOrDefault((l) => l.webUrl.Equals(spListUri.toString()));
      } else {
        list = siteLists.FirstOrDefault((l) => l.displayName.Equals(listTitle));
      }

      allFields = await (graph as any).sites
        .getById(siteId)
        .lists.getById(list.id)
        .columns.filter(filter)();

      const classMember: string[] = [];
      const interfaceMember: string[] = [];
      const classImports: string[] = [];
      const interfaceImports: string[] = [];

      allFields.forEach((field: GraphColumn) => {
        if (NOT_SUPPORTED_FIELDS.indexOf(field.name) !== -1) {
          return;
        }

        // if(!includeHiddenFields && field.columnGroup.Equals("_Hidden")) {
        //     return;
        // }

        const isLookup = isset(field.lookup);
        const isLookupListEmpty = isLookup && isNullOrEmpty(field.lookup.listId);

        if (isLookup && isLookupListEmpty) {
          return;
        }

        const fieldInfo: SPFieldModelInformation = this.getSPFieldModelInformation(field);

        templateInfo.hasLookup = templateInfo.hasLookup || isLookup;
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

  private getSPFieldModelInformation(field: GraphColumn): SPFieldModelInformation {
    const fieldInfo: SPFieldModelInformation = {
      Title: field.displayName,
      StaticName: field.name,
      FieldType: this.getFieldTypeForField(field),
      Type: this.getFieldTypeAsString(field),
      Id: field.id,
      InternalName: field.name,
      EntityPropertyName: field.name.StartsWith('_') ? `OData_${field.name}` : field.name,
      IsReadOnlyField: field.readOnly,
      ModelPropertyName: field.displayName,
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

  private getFieldTypeForField(field: GraphColumn): number {
    if (isset(field.boolean)) {
      return 8;
    }

    if (isset(field.calculated)) {
      return 17;
    }

    if (isset(field.choice)) {
      return field.choice.displayAs === 'checkBoxes' ? 15 : 6;
    }

    if (isset(field.currency)) {
      return 10;
    }

    if (isset(field.dateTime)) {
      return 4;
    }

    if (isset(field.geolocation)) {
      return 31;
    }

    if (
      isset(field.hyperlinkOrPicture) ||
      defaultSPUrlFields.Contains((f) => f.Equals(field.name))
    ) {
      return 11;
    }

    if (isset(field.lookup)) {
      return 7;
    }

    if (isset(field.number) || defaultSPNumberFields.Contains((f) => f.Equals(field.name))) {
      return 9;
    }

    if (isset(field.personOrGroup)) {
      return 20;
    }

    if (isset(field.term)) {
      return 0;
    }

    const isDefaultTextField = defaultSPTextFields.Contains((f) => f.Equals(field.name));
    if (isset(field.text) || isDefaultTextField) {
      return isDefaultTextField ? 2 : field.text.allowMultipleLines ? 3 : 2;
    }

    if (isset(field.thumbnail)) {
      return 0;
    }

    return 0;
  }

  private getFieldTypeAsString(field: GraphColumn): string {
    if (isset(field.boolean)) {
      return 'boolean';
    }

    if (isset(field.calculated)) {
      return 'calculated';
    }

    if (isset(field.choice)) {
      return field.choice.displayAs === 'checkBoxes' ? 'multichoice' : 'choice';
    }

    if (isset(field.currency)) {
      return 'currency';
    }

    if (isset(field.dateTime)) {
      return 'datetime';
    }

    if (isset(field.geolocation)) {
      return 'geolocation';
    }

    if (
      isset(field.hyperlinkOrPicture) ||
      defaultSPUrlFields.Contains((f) => f.Equals(field.name))
    ) {
      return 'url';
    }

    if (isset(field.lookup)) {
      return field.lookup.allowMultipleValues ? 'lookupmulti' : 'lookup';
    }

    if (isset(field.number) || defaultSPNumberFields.Contains((f) => f.Equals(field.name))) {
      return 'number';
    }

    if (isset(field.personOrGroup)) {
      return field.personOrGroup.allowMultipleSelection ? 'usermulti' : 'user';
    }

    if (isset(field.term)) {
      return field.term.allowMultipleValues ? 'taxonomyfieldtypemulti' : 'taxonomyfieldtype';
    }

    const isDefaultTextField = defaultSPTextFields.Contains((f) => f.Equals(field.name));
    if (isset(field.text) || isDefaultTextField) {
      return isDefaultTextField ? 'text' : field.text.allowMultipleLines ? 'note' : 'text';
    }

    if (isset(field.thumbnail)) {
      return 'thumbnail';
    }

    return 'invalid';
  }

  private async getGraphFI(): Promise<GraphFI> {
    const clientApp: ConfidentialClientApplication = new ConfidentialClientApplication(
      this.options.authConfiguration,
    );
    const scopes = [`https://graph.microsoft.com/.default`];

    return graphfi().using(NodeFetch(), GraphDefault(), (instance) => {
      instance.on.auth(async function (url, init) {
        let result = null;

        result = await clientApp.acquireTokenByClientCredential({
          scopes: scopes,
        });

        const accessToken = result.accessToken;

        if (!init.headers) {
          init.headers = {};
        }

        Object.assign(init.headers, {
          Authorization: `Bearer ${accessToken}`,
        });

        return [url, init];
      });

      return instance;
    });
  }
}
