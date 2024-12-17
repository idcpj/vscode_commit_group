export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}   


/**
 * 格式化时间为指定格式
 * @param date 日期对象,默认为当前时间
 * @param format 格式化字符串,默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的时间字符串
 * @example
 * formatDate() // 2024-01-01 12:00:00
 * formatDate(new Date(), 'YYYY年MM月DD日 HH时mm分ss秒') // 2024年01月01日 12时00分00秒
 * formatDate(new Date(), 'YY-MM-DD') // 24-01-01
 */
export function formatDate(date: Date = new Date(), format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    const formatMap: Record<string, string> = {
        'YYYY': year.toString(),
        'YY': year.toString().slice(-2),
        'MM': month.toString().padStart(2, '0'),
        'DD': day.toString().padStart(2, '0'),
        'HH': hour.toString().padStart(2, '0'),
        'mm': minute.toString().padStart(2, '0'),
        'ss': second.toString().padStart(2, '0')
    };

    return format.replace(/(YYYY|YY|MM|DD|HH|mm|ss)/g, match => formatMap[match]);
}
