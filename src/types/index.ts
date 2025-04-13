export interface ICard {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    price: number;
}

export interface IOrderInfo {
    address: string;
    payment: string;
}

export interface IContacts {
    email: string;
    phone: string;
}

export interface IOrder extends IOrderInfo, IContacts {}

export interface OrderResult {
    id: string;
    total: number;
}

export enum Payment {
    card = 'card',
    cash = 'cash',
}

export enum Message {
    phone = 'Укажите номер телефона',
    email = 'Укажите почту',
    payment = 'Укажите способ оплаты',
    address = 'Укажите адрес доставки',
    form = 'Заполните поля',
    no = '',
}

export enum ButtonLabels {
    isAvailable = 'В корзину',
    inBasket = 'Убрать из корзины',
    isUnvailable = 'Недоступно'
}

export type FormErrors = Partial<Record<keyof IOrderInfo | keyof IContacts, string>>;