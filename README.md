# Проектная работа "Веб-ларек"

Интернет-магазин товаров для веб-разработчиков

Стек: HTML, SCSS, TS, Webpack

Паттерн - MVP

Структура проекта:

- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом

Важные файлы:

- src/pages/index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/index.ts — точка входа приложения
- src/scss/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## Установка и запуск

Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```

## Сборка

```
npm run build
```

или

```
yarn build
```

## Архитектура

Проект реализован на основе паттерна MVP (Model-View-Presenter)

* Model (Модель) - хранит данные и управляет бизнес-логикой приложения
* View (Представление) - отвечает за отображение данных на интерфейсе пользователя
* Presenter - осуществляет взаимодействие между Model и View

## Базовый код

1. **Класс API**

Осуществляет запросы на получение и добавление данных на серверную часть

Конструктор принимает следующие аргументы:

1. ```baseURL: string``` - адрес запроса к серверной части
2. ```options: RequestInit``` - дополнительные параметры запроса, по умолчанию пустой объект

Класс имеет следующие методы:

* ```get(uri: string): Promise<object>``` - для получение данных с сервера
* ```post(uri: string, data: object, method: ApiPostMethods): ``` - для отправки данных на сервер
* ```handleResponse(response: Response): Promise<object>``` - для обработки запроса с сервера

2. **Класс EventEmitter**

Позволяет подписываться на события и уведомлять подписчиков о наступлении события
Presenter использует *класс EventEmitter* для обработки событий, которые произошли в слоях Представления (View) и Модели (Model)

Класс имплементируется от интерфейса *IEvents*:
```
interface IEvents {
    on<T extends object>(event: EventName, callback: (data: T) => void): void;
    emit<T extends object>(event: string, data?: T): void;
    trigger<T extends object>(event: string, context?: Partial<T>): (data: T) => void;
}
```

В соответсвии ему, в классе имеются следующие основные методы:

1. ```on``` - для подписки на события
2. ```off``` - для отписки от события
3. ```emit``` - для уведомления подписчиков о наступившем событии

Дополнительными методами являются:

- ```onAll``` - для подписки на все события
- ```offAll```- для отписки от всех событий
- ```trigger``` - для генерации события

3. **Класс Component**

Является абстрактным классом и основой для создания всех компонентов пользовательского интерфейса, инициализирует контейнер компонента, который будет использован для создания компонента, предоставляет инструментарий для работы с DOM в дочерних элементах

Конструктор принимает:

* ```container: HTMLElement``` - контейнер элемента
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Класс имеет методы:

* ``` toggleClass(element: HTMLElement, className: string, force?: boolean)``` - для перключения класса у element
* ```setText(element: HTMLElement, value: unknown)``` - для изменения текстового содержания у element
* ```setDisabled(element: HTMLElement, state: boolean)``` - для изменения статуса блокировки у element
* ```setHidden(element: HTMLElement)``` - для скрытия элемента
* ```setVisible(element: HTMLElement)``` - для отображения отображения элемента
* ```setImage(element: HTMLImageElement, src: string, alt?: string)``` - для установки изображения с альтернативным текстом
* ```render(data?: Partial<T>): HTMLElement``` - для отображения element

4. **Класс Model**

Является абстрактным классом и основой для создания моделей данных для работы приложения, реализует механизм инициализации данных наследника класса Model, реализует механизм уведомления всех подписчиков об изменении данных при помощи метода ```emitChanges```

Конструктор принимает:

* ```data: Partial<T>``` - данные для экземпляров класса
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Класс имеет методы:

* ```emitChanges(event: string, payload?: object)``` - для установки событий о том, что модель поменялась

## Компоненты модели данных (бизнес-логика)

1. **Класс AppState**

Хранит данные приложения и осуществляет их управлением. Позволяет формировать корзину и осуществлять заказы

Конструктор принимает следующие аргументы:

* ```events: Events``` - экземпляр класса *EventEmitter*. Позволяет осущеcтвлять эмитирование событий моделью

Атрибуты класса:

* ```cards: Map<string, ICard>``` - данные всех карточек товара, представленные в приложении, хранит в виде ключа id карточки, в качестве значение данные карточки
* ```basket: Map<string, ICard>``` - карточки товаров, которые были добавлены в корзину, хранит в виде ключа id карточки, в качестве значение данные карточки
* ```order: IOrder``` - данные для осуществления заказа: (Contacts: контакты пользователя - email и phone, OrderInfo: информацию о заказе - payment и address)
* ```messages: FormErrors``` - сообщение об ошибки в данных для атрибута *order*
* ```preview: string | null``` - id карточки для отображения в модальном окне
* ```state: string | null``` - состояние приложения

Класс имеет методы:

* ```loadCards(): void``` - для заполнение данных (карточек) внутри Model
* ```getCard(id: string): ICard``` - для получения карточки по id
* ```addCard(id: string): void``` - для добавления товара в корзину
* ```removeCard(id: string): void``` - для удаления товара из козины
* ```setOrderFiedls(field: keyof IOrderInfo | IContacts, value: string)``` - для заполнения данных для осуществления заказа
* ```getBasketCardId(): MapIterator<string>``` - для получения id карточек из корзины для дальнейшего формирования заказа или проверки доступности кнопки добавления в корзину
* ```formatCurrency(value: number): string``` - для форматирования цены товара под нужную валюту
* ```clearBasket(): void``` - для очистки всей корзины
* ```getTotal(): number``` - получения всей суммы заказа
* ```setPreview(card: ICard): void  ``` - для изменения данных об открытой карточке
* ```getOrder(): IOrder``` - для получения всей информации о заказе
* ```clearOrder(): void``` - для очистки заказа
* ```getState(): string``` - для получения состояния приложения
* ```setState(value: appStates): void``` - для передачи состояния приложени
* ```validateOrder(): FormErrors``` - для проверки данных заказа на валидность, возвращает сообщения, указывающих на отсутсвие данных в атрибуте Order

Является наследником *Класса Model*

Имплиментирует *интерфейс IAppState*


2. **Класс CardApi**

Расширяет функционал базового класса API. используется для получения данных о карточках с сервера, а также отправления заказана сервер

Класс имеет методы:

* ```getCards(): Promise<ICard[]>``` - для получения всех продуктов с сервера
* ```orderCards(order: Order): Promise<OrderResult>``` - заказа выбранных продуктов

Является наследником *Класса API*

Имплиментирует *интерфейс ICardApi*:

```
interface ICardApi {
    getCards: () => Promise<ICard[]>;
    orderCards: (order: Order) => Promise<OrderResult>;
}
```

## Компоненты представления

1. **Класс Main**
   
Отвечает за отображение элементов на странице

Конструктор принимает:

* ```container: HTMLElement``` - контейнер страницы, в котором будут размещаться карточки
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:
   
* ```counter: HTMLElement``` - содержит HTMLElement для отображения счетчика товаров в корзине
* ```catalog: HTMLElement``` - содержит HTMLElement для отображения карточек
* ```basket: HTMLElement``` - содержит HTMLElement корзины на главной странице
* ```wrapper: HTMLElement``` - содержит HTMLElement обертку для страницы

Содержит сеттеры для отображения:
* счетчика корзины
* каталога карточек
* установки состояния блокировки 

Является наследником *Класса Component*

2. **Класс Modal**

Отвечает за отображение модального окна

Конструктор принимает:

* ```container: HTMLElement``` - контейнер модального окна
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:
   
* ```closeButton: HTMLButtonElement``` - содержит HTMLButtonElement для закрытия модального окна
* ```content: HTMLElement``` - содержит HTMLElement для контента внутри модального окна

Содержит сеттер для размещения контента 

Класс имеет методы:

* ```open(): void``` - для открытия модального окна
* ```close(): void``` - для закрытия модальноо окна 
* ```render(data: IModal): HTMLElement``` - для рендера модального окна

Является наследником *Класса Component*

3. **Класс Basket**

Отвечает за отображение корзины внутри контейнера контента в модальном окне

Конструктор принимает:

* ```container: HTMLElement``` - контейнер корзины на основе template из index.html
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:
   
* ```list: HTMLElement``` - содержит HTMLElement для отображения всех карточек, добавленных в корзину
* ```total: HTMLElement``` - содержит HTMLElement для общей суммы покупки
* ```button: HTMLElement``` - содержит HTMLElement для осуществления оформления заказа

Содержит сеттеры для отображения:
* карточек, добавленных в корзину
* изменения статуса блокировки
* отображения общей суммы заказа

Является наследником *Класса Component*

4. **Класс Form**

Компонент формы

Конструктор принимает:

* ```container: HTMLFormElement``` - контейнер для формы на основе template из index.html
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:

* ```error: HTMLElement``` - содержит HTMLlement для осуществлениядля вывода сообщений об ошибках валидации в форме
* ```valid: boolean```: boolean - хранит валидность формы
* ```submit: HTMLButtonElement``` - содержит HTMLButtonElement для осуществления перехода к следующему этапу оформления заказа

Содержит сеттеры для:

* изменяет активность кнопки подтверждения
* отображения ошибки валидации
* установки фокусирования на input

Класс имеет методы:

* ```reset(): void``` - для очистки формы
* ```render(state: Partial<T> & IForm): HTMLFormElement``` - для рендера формы

Является наследником *Класса Component*

5. **Класс Order**

Отвечает за отображение формы заполнения информации о заказе (адрес, способ оплаты) внутри контейнера контента в модальном окне

Конструктор принимает:

* ```container: HTMLFormElement``` - контейнер для формы на основе template из index.html
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:
   
* ```cash: HTMLButtonElement``` - содержит HTMLButtonElement для выбора оплаты "При получении"
* ```card: HTMLButtonElement``` - содержит HTMLButtonElement для выбора оплаты "Картой"
* ```address: HTMLInputElement``` - содержит HTMLInputElement для ввода адреса доставки

Содержит сеттеры для:
* установки адреса доставки
* установки способа оплаты

Является наследником *Класса Form*

6. **Класс Contacts**

Отвечает за отображение формы заполнения контактов внутри контейнера контента в модальном окне

Конструктор принимает:

* ```container: HTMLFormElement``` - контейнер для формы на основе template из index.html
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:
   
* ```email: HTMLInputElement``` - содержит HTMLInputElement для ввода email
* ```phone: HTMLInputElement``` - содержит HTMLInputElement для ввода номера телефона

Содержит сеттеры для:
* установки номера телефона
* установки email

Является наследником *Класса Form*

7. **Класс Success**

Отвечает за статуса "Успешно" о выполнении заказа

Конструктор принимает:

* ```container: HTMLElement``` - контейнер на основе template из index.html
* ```events: IEvents``` - экземпляр *класса EventEmitter* 

Содержит следующие атрибуты:
   
* ```close: HTMLElement``` - содержит HTMLElement для закрытия модального окна 
* ```total: HTMLElement``` - содержит сумму заказа

Содержит сеттер для установки суммы заказа

8. **Класс Card**

Отвечает за отображение карточки 

Конструктор принимает:

* ```container: HTMLElement``` - контейнер для карточки на основе template из index.html
* ```events: IEvents``` - экземпляр *класса EventEmitter* 
* ```action?: ICardAction``` - обработчики событий для осуществления пользовательского взаимодействия с карточкой

Содержит следующие атрибуты:
   
* ```image: HTMLImageElement``` - содержит HTMLImageElement для отображения обложки карточки
* ```category: HTMLElement``` - содержит HTMLElement для отображения категории карточки
* ```title: HTMLElement``` - содержит HTMLElement для отображения названия карточки
* ```description: HTMLElement``` - содержит HTMLElement для отображения описания карточки
* ```price: HTMLElement``` - содержит HTMLElement для отображения цены карточки
* ```buttonBasket: HTMLButtonElement``` - содержит HTMLButtonElement для пользовательского взаимодействия в модальном окне карточки
* ```buttonDelete: HTMLButtonElement``` - содержит HTMLButtonElement для пользовательского взаимодействия в корзине для удаления карточки
* ```id: HTMLElement``` - содержит HTMLElement для отображения номера карточки в корзине

Содержит сеттеры для:
* установки обложки
* установки категории
* установки заголовка
* установки описания
* установки цены
* установки доступности покупки и текста кнопки
* установки индекса в корзине
* установки dataset.id атрибута у элемента 

Также содержит геттер для получения dataset.id атрибута у элемента 

Является наследником *Класса Component*

## Presenter

Отвечает за взаимодействие слоев Model и View между собой на основе событий, которые были сгенерированы с помощью брокера и обработчиков этих событий:

* Принимает событие от View
* Изменяет состояние Model и обновляет View в зависимости от изменений в Model
* Осуществляет управление запросами к серверу с помощью API

Код Presenter описан в ```index.ts```

## Ключевые данные 

Интерфейс данных карточек в Model
```
interface ICard {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    price: number;
}
```

Интерфейс информационных данных о заказе в Model
```
interface IOrderInfo {
    address: string;
    payment: string;
}
```

Интерфейс данных о контактах в Model
```
interface IContacts {
    email: string;
    phone: string;
}
```

Интерфейс данных о заказе в Model
```
interface IOrder extends IOrderInfo, IContacts {}
```

Интерфейс данных о результате обработки заказа в Model
```
interface OrderResult extends Order {
    id: string;
    total: number;
}
```

Список возможных сообщений при проверки валидации форм
```
export enum Message {
    phone = 'Укажите номер телефона',
    email = 'Укажите почту',
    payment = 'укажите способ оплаты',
    address = 'Укажите адресс доставки',
    form = 'Заполните поля',
    no = '',
}
```

Список способов оплаты
```
enum Payment {
    card = 'card',
    cash = 'cash',
}
```

Список labels на кнопке карточке в cardPreview
```
enum ButtonLabels {
    isAvailable = 'В корзину',
    inBasket = 'Убрать из корзины',
    isUnvailable = 'Недоступно'
}
```

Список состояний 
```
const enum appStates {
    basketOpened = 'basket',
    cardPreviewOpened = 'cardPreview',
    orderOpened = 'orderForm',
    successOpened = 'success',
    noOpened = '',
}
```

Список событий
```
const enum appStateEvents {
    // state events
    stateUpdate = 'state:update',
    // cards events
    cardsChanged = 'cards:changed',
    // cardPreview events
    cardPreviewOpen= 'cardPreview:open',
    // basket events
    basketOpen = 'basket:open',
    basketChanged = 'basket:changed',
    basketSubmit = 'basket:submit',
    // order events
    orderSubmit = 'order:submit',
    paymentSelected = 'payment:select',
    // contacts events
    contactsSubmit = 'contacts:submit',
    // success events 
    successSubmit = 'success:submit',
    // modal events
    modalOpen = 'modal:open',
    modalClose = 'modal:close',
}
```
Список событий на изменение полей в формах
```
const appStateEventPatterns = {
    orderInputChange: /^order\..*:change/,
    contactsInputChange: /^contacts\..*:change/,
}
```

Аннотация данных об ошибках валидации
```
type FormErrors = Partial<Record<keyof IOrderInfo | keyof IContacts, string>>;
```


## Основные события

* ```state:update``` - изменение состояния приложения
* ```cards:changed``` - изменение элементов каталога
* ```cardPreview:open``` - открытие предпросмотра товара в модальном окне
* ```basket:open``` - открытие корзины
* ```basket:changed``` - изменение состояния корзины (при удалении или добавлении товара в корзину)
* ```basket:submit``` - потверждение товаров в корзине и открытие формы для внесения данных о заказе
* ```payment:select``` - изменение выбора способа оплаты
* ```order:submit``` - подтверждение внесенных данных и открытие формы заполнения контактов
* ```contacts:submit``` - потверждение введенных данных в полях формы контактов, отправка заказа на сервер (в случае успешного заказа - открытие окна со статусом об успешной отправке заказа на сервер)
* ```success:submit``` - закрытие окна со статусом об успешной отправке заказа на сервер
* ```/^order\..*:change/``` - изменение полей ввода в форме с информацией о заказе
* ```/^contacts\..*:change/``` - изменение полей ввода в форме с информацией о контактах пользователя
* ```modal:open``` - открытие модального окна
* ```modal:close``` - закрытие модального окна


