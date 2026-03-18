import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateFormat',
    standalone: true
})
export class DateFormatPipe implements PipeTransform {
    transform(value: any): string {
        if (!value) return '';

        // Check if value is a valid ISO date string
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;

        // We only format strings that look like dates (YYYY-MM-DD or containing T and Z)
        const isIsoDate = typeof value === 'string' &&
            (/^\d{4}-\d{2}-\d{2}/.test(value) || value.includes('T'));

        if (!isIsoDate) return value;

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }
}
