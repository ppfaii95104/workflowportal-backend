export interface IBaseDataListResponse {
    updated_date: string;
    updated_by_name: string;
    status: 1 | 0;
}


export interface IPagination {
    page: number | 1;
    page_size: number | 10;
    total: number;
    total_page: number;
    sort: ISort;
}


export interface ISort {
    property : string;
    direction : 'asc' | 'desc';
}