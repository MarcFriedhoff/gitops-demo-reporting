// Import necessary modules
import { AppConfig, BuildSummary } from '../../shared/models/types';
import { parse } from '@ctrl/golang-template';
import yaml from 'js-yaml';

type Values = { [key: string]: any };

function createMessageCardFromTemplate(template: string, buildSummary: BuildSummary, color: string, link: string, activityImage: string) {    
    
    const variables: Record<string, any>  = {
        buildSummary: buildSummary,
        color: color,
        deepLink: link,
        activityImage: activityImage
    };

    console.log(variables);

    console.log(template);


    const card = parse(template, variables);

    console.log("-------------");
    console.log(card);
    console.log("-------------");

    // convert yaml string to json
    const yamlObject = yaml.load(card);

    // convert to json
    const jsonObject = JSON.stringify(yamlObject);

    // beautify json
    const out = JSON.stringify(JSON.parse(jsonObject), null, 2);
    console.log(out);
    
    // const card = deepReplace(template, values);

    return card;
}

export { createMessageCardFromTemplate };

