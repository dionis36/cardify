import Ajv from 'ajv';
import templateSchema from '@/public/templates/schema.json';

const ajv = new Ajv({ allErrors: true, verbose: true });
const validate = ajv.compile(templateSchema);

export interface ValidationError {
    field: string;
    message: string;
    path: string;
}

export function validateTemplate(template: any): {
    valid: boolean;
    errors: ValidationError[];
} {
    const valid = validate(template);

    if (valid) {
        return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = (validate.errors || []).map(error => ({
        field: error.instancePath || 'root',
        message: error.message || 'Unknown error',
        path: error.instancePath.replace(/\//g, '.').substring(1) || 'root',
    }));

    return { valid: false, errors };
}

export function getSchemaRequiredFields(): string[] {
    return templateSchema.required || [];
}

export function getSchemaDefinitions() {
    return templateSchema.definitions || {};
}
