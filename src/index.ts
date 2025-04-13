import './scss/styles.scss';
import { AppState } from './components/model/AppState';
import { CardApi } from './components/model/CardApi';
import { EventEmitter } from './components/base/events';
import { ICard, ButtonLabels, Message, IOrderInfo, IContacts } from './types';
import { settings, API_URL, CDN_URL, appStateEvents, appStateEventPatterns } from './utils/constants'
import { Main } from './components/view/screen/Main';
import { cloneTemplate } from './utils/utils';
import { Card } from './components/view/screen/Card';
import { Modal } from './components/view/partial/Modal';
import { Basket } from './components/view/partial/Basket';
import { Order } from './components/view/partial/Order';
import { Contacts } from './components/view/partial/Contacts';
import { Success } from './components/view/partial/Success';

const BASE_URL = process.env.API_ORIGIN;

// Список состояния
export enum appStates {
    basketOpened = 'basket',
    cardPreviewOpened = 'cardPreview',
    orderOpened = 'orderForm',
    successOpened = 'success',
    noOpened = '',
}

// Шаблоны
const mainContainer = document.querySelector(settings.mainSelector) as HTMLTemplateElement;
const cardCatalogTemplate = document.querySelector(settings.cardCatalogTemplate) as HTMLTemplateElement;
const cardBasketTemplate = document.querySelector(settings.cardBasketTemplate) as HTMLTemplateElement;
const cardPreviewTemplate = document.querySelector(settings.cardPreviewTemplate) as HTMLTemplateElement;
const basketTemplate = document.querySelector(settings.basketTemplate) as HTMLTemplateElement;
const orderTemplate = document.querySelector(settings.orderInfoTemplate) as HTMLTemplateElement;
const contactsTemplate = document.querySelector(settings.contactsTemplate) as HTMLTemplateElement;
const successTemplate = document.querySelector(settings.successTemplate) as HTMLTemplateElement;
const modalTemplate = document.querySelector(settings.modalTemplate) as HTMLTemplateElement;

// Классы слоя данных
const events = new EventEmitter();
const api = new CardApi(BASE_URL, API_URL, CDN_URL);
const app = new AppState({}, events);

// Классы слоя представления
const main = new Main(mainContainer, events);
const modal = new Modal(modalTemplate, events);
const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Contacts(cloneTemplate(contactsTemplate), events);
const success = new Success(cloneTemplate(successTemplate), events);

/**
 * Обрабатывает изменение списка карточек в каталоге в model
 * 
 * @event appStateEvents.cardsChanged
 * @param {Iterable<ICard>} cards - Итератор с обновленным списком карточек товаров
 * 
 * При вызове обновляет каталог в слое View, создавая новые экземпляры карточек на основе шаблона
 */
events.on(appStateEvents.cardsChanged, (cards: Iterable<ICard>) => {
    main.catalog = Array.from(cards).map(cardData => {
        const card = new Card(cloneTemplate(cardCatalogTemplate), events, {
            onClick: () => app.setPreview(cardData),
        });
        return card.render({
            ...cardData,
            price: app.formatCurrency(cardData.price),
        });
    })
});


/**
 * Открывает предпросмотр карточки товара в модальном окне
 * 
 * @event appStateEvents.cardPreviewOpen
 * @param {Object} data - Объект с информацией о карточке товара
 * 
 */
events.on(appStateEvents.cardPreviewOpen, (data: {
    id: string, 
    title: string,
    description: string;
    image: string;
    category: string;
    price: number;
})  => {
    app.setState(appStates.cardPreviewOpened);
    
    const buttonLabel = app.getBasketCardId().includes(data.id) ? 
        ButtonLabels.inBasket: 
        data.price === null ? 
            ButtonLabels.isUnvailable:
            ButtonLabels.isAvailable;
    
    modal.open();
    modal.content = new Card(cloneTemplate(cardPreviewTemplate), events, {
        onClick: () => events.emit(appStateEvents.basketChanged, {id: data.id})
    }).render({
        ...data,
        price: app.formatCurrency(data.price),
        buttonLabel: buttonLabel,
    });
});

/**
 * Обрабатывает состояния корзины
 * 
 * @event appStateEvents.basketChanged
 * @param {Object} data - Объект с информацией о карточке товара
 * @param {string} data.id - Идентификатор карточки товара для получения ее данных
 * 
 * При вызове выполняет добавление товара в корзину или его удаление
 */
events.on(appStateEvents.basketChanged, (data: {id: string}) => {
    if (app.getBasketCardId().includes(data.id)) {
        app.removeCard(data.id);
    } else {
        app.addCard(data.id);
    }
})

/**
 * Отвечает за отображение корзины
 * 
 * @event appStateEvents.basketOpen
 * 
 * При вызове выполняет рендер компонента "Basket" и отображает
 * его содержимое в модальном окне
 */
events.on(appStateEvents.basketOpen, () => {
    app.setState(appStates.basketOpened);
    app.clearOrder();

    modal.open();
    modal.content = basket.render();
});

/**
 * Отвечает за отображение формы заполнения информации о заказе
 * 
 * @event appStateEvents.basketSubmit
 * 
 * При вызове выполняет рендер компонента "Order" и отображает
 * его содержимое в модальном окне
 */
events.on(appStateEvents.basketSubmit, () => {
    app.setState(appStates.orderOpened);
    console.log(app.validateOrder().payment, app.validateOrder().address)

    modal.content = order.render({
        payment: app.getOrder().payment,
        address: app.getOrder().address,
        valid: !(app.getOrder().payment && app.getOrder().address),
        error: (app.validateOrder().payment !== undefined && app.validateOrder().address !== undefined)?
                    Message.form:
                    app.validateOrder().payment !== undefined?
                        Message.payment:
                        app.validateOrder().address !== undefined?
                            Message.address:
                            Message.no,        
    })
})

/**
 * Отвечает за добавление данных в заказ в Model из формы
 * заполнения информации о заказе
 * 
 * @event appStateEventPatterns.orderInputChange
 * @param {Object} data - Объект с информацией о input
 * @param {keyof IOrderInfo} data.field - Имя поля ввода
 * @param {string} data.value - Внесенные данные в поле ввода
 * 
 * При вызове выполняет заполнение данных об заказе в Model в соответствии с именем поля ввода
 * и внесенным значением
 */
events.on(appStateEventPatterns.orderInputChange, (data: { field: keyof IOrderInfo, value: string }) => {
    app.setOrderFiedls(data.field, data.value);
})

/**
 * Отвечает за изменения способа выбора оплаты в Model
 * 
 * @event appStateEvents.paymentSelected
 * @param {Object} data - Объект с информацией о способе оплаты
 * @param {keyof IOrderInfo} data.payment - Название способа оплаты
 */
events.on(appStateEvents.paymentSelected, (data: {payment: keyof IOrderInfo}) => {
    app.setOrderFiedls('payment', data.payment);
})

/**
 * Отвечает за отображение формы заполнения контактов пользователя
 * 
 * @event appStateEvents.orderSubmit
 * При вызове выполняет рендер компонента "Contacts" и отображает
 * его содержимое в модальном окне
 */
events.on(appStateEvents.orderSubmit, () => {
    modal.content = contacts.render({
        email: app.getOrder().email,
        phone: app.getOrder().phone,
        valid: !(app.getOrder().email && app.getOrder().phone),
        error: (app.validateOrder().email !== undefined && app.validateOrder().phone !== undefined)?
                    Message.form:
                    app.validateOrder().email !== undefined?
                        Message.email:
                        app.validateOrder().phone !== undefined?
                            Message.phone:
                            Message.no,     
    })
})

/**
 * Отвечает за добавление данных в заказ в Model из формы
 * заполнения контактов пользователя
 * 
 * @event appStateEventPatterns.orderInputChange
 * @param {Object} data - Объект с информацией о input
 * @param {keyof IContacts} data.field - Имя поля ввода
 * @param {string} data.value - Внесенные данные в поле ввода
 * 
 * При вызове выполняет заполнение данных об заказе в Model в соответствии с именем поля ввода
 * и внесенным значением
 */
events.on(appStateEventPatterns.contactsInputChange, (data: { field: keyof IContacts, value: string }) => {
    app.setOrderFiedls(data.field, data.value);
})

/**
 * Отвечает за отправку данных на сервер после нажатия пользователя
 * на кнопку оформления заказа
 * 
 * @event appStateEvents.contactsSubmit
 * При вызове выполняется отправка заказа на сервер
 */
events.on(appStateEvents.contactsSubmit, () => {
    api.orderCards(app.getOrder())
        .then(data => {
            app.setState(appStates.successOpened);
            app.clearBasket();
            app.clearOrder();

            modal.content = success.render({
                total: app.formatCurrency(data.total),
            });
        })
        .catch(err => console.log(err))
})

/**
 * Отвечает за закрытие окна с информацией об успешном оформлении заказа
 * 
 * @event appStateEvents.successSubmit
 */
events.on(appStateEvents.successSubmit, () => {
    modal.close();
})

/**
 * Отвечает за отображение модального окна на странице
 * 
 * @event appStateEvents.modalOpen
 */
events.on(appStateEvents.modalOpen, () => {
    main.isLocked = true;
});

/**
 * Отвечает за скрытие модального окна со страницы
 * 
 * @event appStateEvents.modalClose
 */
events.on(appStateEvents.modalClose, () => {
    app.setState(appStates.noOpened);
    updateState();

    main.isLocked = false;
});

/** 
 * Событие, осуществляющее изменение состояния приложения  
 *  
 * @event AppStateEvents.stateUpdate 
 * @param {Object} data - Объект с данными для изменения состояния 
 * @param {string} data.id - id карточки 
 * @param {keyof IOrderInfo | keyof IContacts} data.field - Имя поля ввода 
 */ 

events.on(appStateEvents.stateUpdate, (data?: { 
    id: string,  
    field: keyof IOrderInfo | keyof IContacts,
}) => { 
    updateState({
        id: data.id, 
        field: data.field,
    });
}) 

/**
 * Функция, отвечает за изменение состояния приложения 
 * 
 * @param {Object} data - Объект с данными для изменения состояния
 * @param {string} data.id - id карточки
 * @param {keyof IOrderInfo | keyof IContacts} data.field - Имя поля ввода
 */
function updateState(data?: {
    id?: string, 
    field?: keyof IOrderInfo | keyof IContacts,
}) {
    switch(app.getState()) {
        case appStates.cardPreviewOpened: {
            renderCardPreview({id: data.id});
            renderBasket();
            main.counter = app.getBasketCardId().length;
            break;
        }
        case appStates.basketOpened: {
            renderBasket();
            main.counter = app.getBasketCardId().length;
            break;
        }
        case appStates.orderOpened: {
            (data && 'field' in data)?
                renderOrder({field: data.field}):
                renderOrder();
            break;
        } 
        case appStates.successOpened: {
            renderBasket();
            break;
        } 
        default: main.counter = app.getBasketCardId().length;
    }
}

/**
 * Функция, выполняющая изменение модального окна с предпросмотром карточки товара
 * 
 * @param {Object} data - Объект с информацией о карточке товара
 * @param {string} data.id - Идентификатор карточки товара для получения ее данных
 * 
 * При вызове создает новый экземпляр карточки для предпросмотра в модальном
 * окне в соответствии с действиями пользователя (товар добавлен в корзину или
 * убран из нее)
 */
function renderCardPreview(data: {id: string}) {
    const cardData = app.getCard(data.id);
    
    modal.content = new Card(cloneTemplate(cardPreviewTemplate), events, {
        onClick: () => events.emit(appStateEvents.basketChanged, {id: data.id})
    }).render({
        ...cardData,
        buttonLabel: app.getBasketCardId().includes(data.id)?
            ButtonLabels.inBasket:
            ButtonLabels.isAvailable,
        price: app.formatCurrency(cardData.price),
    });
}

/**
 * Функция, выполняющая изменение отображение корзины
 * 
 * При вызове выполняет ререндер компонента "Basket" 
 * в соответствии с внесенными изменениям 
 */
function renderBasket() {
    basket.render({
        total: app.formatCurrency(app.getTotal()),
        disabled: app.getBasketCardId().length === 0 ? 
            true: 
            false,
        items: app.getBasketCardId().map((cardId, index) => {
            const cardData = app.getCard(cardId);
            return new Card(cloneTemplate(cardBasketTemplate), events, {
                onClick: () => events.emit(appStateEvents.basketChanged, {id: cardData.id})
            }).render({
                title: cardData.title,
                price: app.formatCurrency(cardData.price),
                indexLabel: (index + 1).toString(),
            });
        })
    });
}

/**
 * Функция, выполняющая изменение отображения форм заполнения информации о заказе и заполнения контактов
 * 
 * @param {Object} data - Объект с информацией о input
 * @param {keyof IOrderInfo | keyof IContacts} data.field - Имя поля ввода
 * 
 * Выполняет ререндер форм в соответствии с внесенными данными
 */
function renderOrder(data?: {field: keyof IOrderInfo | keyof IContacts}) {
    order.render({
        payment: app.getOrder().payment,
        address: app.getOrder().address,
        valid: !(app.getOrder().payment && app.getOrder().address),
        error: (app.validateOrder().payment !== undefined && app.validateOrder().address !== undefined)?
                    Message.form:
                    app.validateOrder().payment !== undefined?
                        Message.payment:
                        app.validateOrder().address !== undefined?
                            Message.address:
                            Message.no,        
    })

    contacts.render({
        email: app.getOrder().email,
        phone: app.getOrder().phone,
        valid: !(app.getOrder().email && app.getOrder().phone),
        error: (app.validateOrder().email !== undefined && app.validateOrder().phone !== undefined)?
                    Message.form:
                    app.validateOrder().email !== undefined?
                        Message.email:
                        app.validateOrder().phone !== undefined?
                            Message.phone:
                            Message.no,     
    })

    if (data && data.field) {
        if (data.field in order) {
            order.focus = data.field as keyof IOrderInfo;
        } else if (data.field in contacts) {
            contacts.focus = data.field as keyof IContacts;
        }
    }
}

/**
 * Загрузка всех карточек товаров с сервера
 */
api.getCards()
    .then(data => app.loadCards(data))
    .catch(err => console.log(err));
