import './components/scssSettings/fonts.scss';
import './components/garage/garage.scss';
import './components/winners/winners.scss';
import './global.scss';
import { UpdateManager } from './components/createManager';
import { Garage } from './components/garage/garage';
import { Winners } from './components/winners/winners';
import { SingletonReproducer, StateManager } from './components/state';
import { AdvancedApi } from './components/API/api';
import {
    IcreateCar,
    IWinner,
    TColorText,
    TVelocity,
    ITableObject,
    TDriveMode,
} from './components/interfaces/interface';

class Manager {
    updateManager: UpdateManager;
    garagePage: Garage;
    winnersPage: Winners;
    state: StateManager;
    api: AdvancedApi;
    templateColor: string;
    templateName: string;
    templateNameUpdate: string;
    templateUpdateColor: string;
    toggleTime: boolean;
    toggleSortWinner: boolean;
    globalIdAnimation: number;
    allAnimation: number[];
    checkerStop: boolean;
    checkerStopAll: boolean;
    constructor(
        updateManager: UpdateManager,
        garagePage: Garage,
        winnersPage: Winners,
        state: StateManager,
        api: AdvancedApi
    ) {
        this.updateManager = updateManager;
        this.garagePage = garagePage;
        this.winnersPage = winnersPage;
        this.state = state;
        this.api = api;
        this.templateColor = 'input__color';
        this.templateName = 'input__name';
        this.templateNameUpdate = 'input__update';
        this.templateUpdateColor = 'update__color';
        this.toggleTime = true;
        this.toggleSortWinner = true;
        this.globalIdAnimation = 0;
        this.allAnimation = [];
        this.checkerStop = false;
        this.checkerStopAll = false;
    }

    private filterState(id: number) {
        const valueId = this.state.mainObject.winners.find((value) => value.id === id);
        return valueId;
    }

    private filterStateBySpeed(newTime: number, objOfWins: IWinner) {
        if (objOfWins.time > newTime) {
            objOfWins.time = newTime;
        }
        return objOfWins;
    }

    public randomModelCar() {
        const brandCars = this.state.brandsCars;
        const modelCars = this.state.modelsCars;
        const fakeArr = Array.from(Array(100).keys());
        const getValueName = fakeArr.map((_, i) => {
            const color = this.updateManager.randomColor();
            const firstNumber = this.updateManager.randomInterval();
            const secondNumber = this.updateManager.randomInterval();
            const obj = {
                name: `${brandCars[firstNumber]}-${modelCars[secondNumber]}`,
                color: color,
            };

            const res = this.api.createCar(obj).then((value) => this.api.errorHandlerUndefined(value));
            return res;
        });
        return getValueName;
    }

    private refereceEventCar = () => {
        const textContent = this.updateManager.getInputFromInput(this.templateName);
        const getColor = this.updateManager.getColorFromInput(this.templateColor);
        const carObj: TColorText = {
            name: textContent,
            color: getColor,
        };

        this.state.mainObject.objectColorName = {
            name: textContent,
            color: getColor,
        };

        this.api
            .createCar(carObj)
            .then((value) => this.api.errorHandlerUndefined(value))
            .then((value) => this.garagePage.renderCarItem(value))
            .then((_) => {
                this.getDataFromGarage();
            })
            .then((_) => this.garagePage.updateGarage())
            .then((_) => this.getCarListner())
            .catch((err: Error) => err);
    };

    public EventCreateCar() {
        const btnCreateCar = this.updateManager.getHTMLElement('input__button');

        btnCreateCar.addEventListener('click', this.refereceEventCar);
    }

    private referenceUpdateButton = () => {
        const textContent = this.updateManager.getInputFromInput(this.templateNameUpdate);
        const getColor = this.updateManager.getColorFromInput(this.templateUpdateColor);
        const carObj: TColorText = {
            name: textContent,
            color: getColor,
        };

        this.state.mainObject.updateColorName = {
            name: textContent,
            color: getColor,
        };

        const id = this.state.mainObject.selectedCar;
        const element = document.querySelector(`[data-value="${id}"]`);
        if (element === null || element === undefined) {
            return;
        }

        const parent = this.updateManager.getHTMLElement('garage__items');

        this.api
            .updateCar(id, carObj)
            .then((value: IcreateCar) => this.api.errorHandlerUndefined(value))
            .then((value) => {
                this.garagePage.renderCarItem(value);
                const lastChild = parent.lastElementChild as HTMLElement;
                parent.replaceChild(lastChild, element);
            })
            .then((_) => this.getCarListner())
            .catch((err: Error) => err);
    };

    public EventUpdateCar() {
        const btnUpdateCar = this.updateManager.getHTMLElement('update__button');
        btnUpdateCar.addEventListener('click', this.referenceUpdateButton);
    }

    private referecneEventRaceCar = () => {
        (() => {
            const car = document.querySelector('.car') as HTMLElement;
            const distanceElement = this.getDistanceBeetwenElement(car) - 20;
            const svg: NodeListOf<Element> = document.querySelectorAll('svg');

            const arayOfNumbers: Array<{ element: SVGElement; number: number }> = [];

            for (const item of svg) {
                const element = item as SVGElement;
                const carElementWithDataValue = item.closest('.car') as HTMLElement;
                const number = carElementWithDataValue.dataset.value;
                arayOfNumbers.push({ element: element, number: Number(number) });
            }

            let flag = true;
            const timeWinner = arayOfNumbers.map(async (item) => {
                const { element, number } = item as { element: SVGElement; number: number };
                const { velocity, distance } = (await this.api.getStartEngined(Number(number))) as TVelocity;
                const timeSeconds = Math.round(distance / velocity);
                const id = this.startAnimation(element, timeSeconds, distanceElement, Number(number));
                const { success } = (await this.api.driveMode(Number(number))) as { success: boolean };
                if (success === false) {
                    window.cancelAnimationFrame(this.globalIdAnimation);
                } else {
                    if (flag === true) {
                        flag = false;
                        const car = await this.api.getCar(number);
                        const carElement = this.api.errorHandlerUndefined(car);
                        const element = this.updateManager.getHTMLElement('span__winner');
                        const { name, id }: Pick<IcreateCar, 'name' | 'id'> = carElement;
                        const time = timeSeconds / 1000;
                        const wins = 1;
                        const splitData = `${name}, Time: ${time} s`;
                        if (this.checkerStopAll === true) {
                            this.updateManager.AddTextContentToHTMLElement(element, '');
                            this.checkerStopAll = false;
                        } else {
                            this.updateManager.AddTextContentToHTMLElement(element, splitData);
                            this.state.mainObject.currentWinner = [splitData];
                            this.checkerStopAll = false;
                        }
                        this.updateManager.AddTextContentToHTMLElement(element, splitData);
                        this.state.mainObject.currentWinner = [splitData];
                        const isExistInState = this.filterState(id);
                        if (isExistInState === undefined) {
                            await this.api.createWinner({ id, wins, time });
                            this.state.mainObject.winners.push({ id, wins, time });
                        } else {
                            isExistInState.wins += 1;
                            const newSpeedData = this.filterStateBySpeed(time, isExistInState);
                            await this.api.updateWinner(newSpeedData);
                        }
                    }
                }
            });
        })();
    };

    public EventRaceCar() {
        const btnRaceCar = this.updateManager.getHTMLElement('race__button');
        btnRaceCar.addEventListener('click', this.referecneEventRaceCar);
    }

    private referenceEventResetCar = () => {
        this.checkerStopAll = true;
        this.allAnimation.forEach((item) => cancelAnimationFrame(item));
        this.returnToPositionAll();
        const spanWinner = this.updateManager.getHTMLElement('span__winner');
        spanWinner.innerHTML = '';
        const callback = async () => {
            const allCars = (await this.api.getCars(1000)) as IcreateCar[];
            for (const key of allCars) {
                await this.api.getStopEngined(key.id);
            }
        };
        void callback();
    };

    public EventResetCar() {
        const btnRaceReset = this.updateManager.getHTMLElement('race__reset');
        btnRaceReset.addEventListener('click', this.referenceEventResetCar);
    }

    private refereceEventGenerateManyCar = (event: PointerEvent) => {
        const btnGenerateCar = this.updateManager.getHTMLElement('race__generate');
        btnGenerateCar.removeEventListener('click', this.refereceEventGenerateManyCar as EventListener);

        const value = this.randomModelCar();
        value.map((item) =>
            item.then((value) => {
                this.garagePage.renderCarItem(value);
            })
        );
        Promise.all(value)
            .then((_) => this.getCarListner())
            .then((_) => {
                this.getDataFromGarage();
                this.garagePage.updateGarage();
            })
            .catch((err: Error) => console.log(`${err.message} in promise all when generate many carr`));
    };

    public EventGenerateManyCar() {
        const btnGenerateCar = this.updateManager.getHTMLElement('race__generate');
        btnGenerateCar.addEventListener('click', this.refereceEventGenerateManyCar as EventListener);
    }

    private referenceSelectCar = (event: PointerEvent) => {
        const element = event.target as HTMLElement;
        const value = element.closest('.car');
        const number = value?.getAttribute('data-value');
        this.state.mainObject.selectedCar = Number(number);
    };

    public EventSelectCar() {
        const getBtnCarSelect = this.updateManager.getAllHTMLElement('car__select');
        getBtnCarSelect.forEach((item) => {
            item.addEventListener('click', this.referenceSelectCar as EventListener);
        });
    }

    public getPosition(element: HTMLElement) {
        const { top, left, width, height } = element.getBoundingClientRect();
        return {
            x: left + width / 2,
            y: top + height / 2,
        };
    }

    public getDistanceBeetwenElement(parentELement: HTMLElement) {
        const car = parentELement.querySelector('svg') as unknown;
        const finish = parentELement.querySelector('.car__finish') as HTMLElement;
        const carElement = car as HTMLElement;
        const CarPosition = this.getPosition(carElement);
        const FinishPosition = this.getPosition(finish);

        return Math.hypot(CarPosition.x - FinishPosition.x, CarPosition.y - FinishPosition.y);
    }

    public startAnimation(element: SVGElement, time: number, distanceElement: number, num: number) {
        let start: number | null = null;
        const doAnimation = (timeStomp: number) => {
            if (!start) start = timeStomp;
            const getTime = timeStomp - start;
            const passed = Math.round(getTime * (distanceElement / time));

            const getVal = Math.min(passed, distanceElement);

            element.style.transform = `translateX(${getVal}px`;
            if (passed < distanceElement) {
                this.globalIdAnimation = requestAnimationFrame(doAnimation);
                const value = this.globalIdAnimation;
                this.allAnimation.push(value);
            }
        };
        const id = requestAnimationFrame(doAnimation);
    }

    public returnToPositionAll() {
        const getAllSvg: NodeListOf<Element> = document.querySelectorAll('svg');
        getAllSvg.forEach((item) => {
            const element = item as HTMLElement;
            element.style.transform = `translateX(${0}px`;
        });
    }

    private referenceCarMove = (event: PointerEvent) => {
        const element = event.target as HTMLElement;
        const value = element.closest('.car') as HTMLElement;
        const number = value?.getAttribute('data-value');
        const distanceElement = this.getDistanceBeetwenElement(value) - 20;

        let flag = true;
        const dataSetLikeNumber = Number(number);
        void (async () => {
            const svg = <SVGElement>value.querySelector('svg');
            const { velocity, distance } = (await this.api.getStartEngined(Number(number))) as TVelocity;
            const timeSeconds = Math.round(distance / velocity);
            const id = this.startAnimation(svg, timeSeconds, distanceElement, Number(number));
            const { success } = (await this.api.driveMode(dataSetLikeNumber)) as TDriveMode;
            if (success === false) {
                window.cancelAnimationFrame(this.globalIdAnimation);
            } else {
                if (flag === true) {
                    flag = false;
                    const car = await this.api.getCar(dataSetLikeNumber);
                    const carElement = this.api.errorHandlerUndefined(car);
                    const element = this.updateManager.getHTMLElement('span__winner');
                    const { name, id }: Pick<IcreateCar, 'name' | 'id'> = carElement;
                    const time = timeSeconds / 1000;
                    const wins = 1;
                    const splitData = `${name}, Time: ${time} s`;
                    if (this.checkerStop === true) {
                        this.updateManager.AddTextContentToHTMLElement(element, '');
                        this.checkerStop = false;
                    } else {
                        this.updateManager.AddTextContentToHTMLElement(element, splitData);
                        this.checkerStop = false;
                    }
                    const isExistInState = this.filterState(id);
                    if (isExistInState === undefined) {
                        await this.api.createWinner({ id, wins, time });
                        this.state.mainObject.winners.push({ id, wins, time });
                    } else {
                        isExistInState.wins += 1;
                        const newSpeedData = this.filterStateBySpeed(time, isExistInState);
                        await this.api.updateWinner(newSpeedData);
                    }
                }
            }
        })();
    };

    public EventStartCarMove() {
        const getBtnCarMove = this.updateManager.getAllHTMLElement('car__start');
        getBtnCarMove.forEach((item) => {
            item.addEventListener('click', this.referenceCarMove as EventListener);
        });
    }

    public EventReturCarToPrevPosition() {
        const getBtnCarToPrevPosition = this.updateManager.getAllHTMLElement('car__back');
        getBtnCarToPrevPosition.forEach((item) => {
            item.addEventListener('click', (event: Event) => {
                this.checkerStop = true;
                const element = event.target as HTMLElement;
                const value = element.closest('.car') as HTMLElement;
                const number = value.dataset.value;
                const svg = value.querySelector('svg') as SVGElement;
                svg.style.transform = `translateX(${0}px`;
                this.api.getStopEngined(Number(number)).catch((err: Error) => console.warn(err));
                cancelAnimationFrame(this.globalIdAnimation);
                const spanWinner = this.updateManager.getHTMLElement('span__winner');
                spanWinner.innerHTML = '';
            });
        });
    }

    public EventRemoveCar() {
        const getBtnCarRemove = this.updateManager.getAllHTMLElement('car__remove');
        getBtnCarRemove.forEach((item) => {
            item.addEventListener('click', () => {
                const value = item.closest('.car');
                const number = value?.getAttribute('data-value');
                const id = Number(number);
                this.api.removeCar(id).catch((err: Error) => err.message);
                const element = document.querySelector(`[data-value="${id}"]`) as HTMLElement;
                if (element === null || element === undefined) {
                    return;
                }
                this.updateManager.removeNodes([element]);
                this.getDataFromGarage();
                this.garagePage.updateGarage();
            });
        });
    }

    public EventInputCreaterContent() {
        const getInputText = this.updateManager.getHTMLElement(this.templateName);

        getInputText.addEventListener('change', () => {
            const textContent = this.updateManager.getInputFromInput(this.templateName);
            const getColor = this.updateManager.getColorFromInput(this.templateColor);
            this.state.mainObject.objectColorName = {
                name: textContent,
                color: getColor,
            };
        });
    }

    public EventInputCreateColor() {
        //FIXME: Переписать
        const templateString = 'input__color';
        const getColorValue = this.updateManager.getHTMLElement(templateString);
    }

    public EventInputUpdateColor() {
        const getInputText = this.updateManager.getHTMLElement(this.templateUpdateColor);

        getInputText.addEventListener('change', () => {
            const textContent = this.updateManager.getInputFromInput(this.templateNameUpdate);
            const getColor = this.updateManager.getColorFromInput(this.templateUpdateColor);
            this.state.mainObject.objectColorName = {
                name: textContent,
                color: getColor,
            };
        });
    }

    public EventInputUpdateContent() {
        const getInputText = this.updateManager.getHTMLElement(this.templateNameUpdate);

        getInputText.addEventListener('change', () => {
            const textContent = this.updateManager.getInputFromInput(this.templateNameUpdate);
            const getColor = this.updateManager.getColorFromInput(this.templateUpdateColor);
            this.state.mainObject.updateColorName = {
                name: textContent,
                color: getColor,
            };
        });
    }

    private refereRenderPageGarage = () => {
        this.garagePage.renderPageWithRemove();
        this.getSettingListener();
        const { cars } = this.state.mainObject.currentData;
        void (async () => {
            for (const item of cars) {
                const result = await this.api.getCar(item);
                const value = this.api.errorHandlerUndefined(result);
                this.garagePage.renderCarItem(value);
            }
            this.garagePage.updateGarage();
            this.getAllListener();
        })();
    };

    public renderPageGarage() {
        const btnGaragePage = this.updateManager.getHTMLElement('navigation__garage');
        btnGaragePage.addEventListener('click', this.refereRenderPageGarage as EventListener);
    }

    public getDataFromGarage() {
        const page = document.querySelector('.garage__page__count');
        const cars = this.updateManager.getAllHTMLElement('car');

        if (page === null) {
            return;
        } else {
            const getPageInfo = page.textContent;
            const arrayOfId: Array<number> = [];

            cars.forEach((element) => {
                const el = element as HTMLElement;
                const value = el.dataset.value;
                arrayOfId.push(Number(value));
            });

            const getGarageInfo = cars.length;
            this.state.mainObject.currentData = {
                garageCount: Number(getGarageInfo),
                pageCount: Number(getPageInfo),
                cars: arrayOfId,
            };
        }
    }

    private filterStateWinners(obj: IWinner[]) {
        return obj.filter((item: IWinner) => item.id !== 0);
    }

    private sortByWinners(winners: IWinner[], cars: IcreateCar[]) {
        const data: ITableObject[] = [];
        winners.map((winItem) => {
            cars.map((carItem) => {
                if (winItem.id === carItem.id) {
                    data.push({
                        id: winItem.id,
                        name: carItem.name,
                        wins: winItem.wins,
                        bestTime: winItem.time,
                        color: carItem.color,
                    });
                }
            });
        });
        return data;
    }

    private referencePageWinner = () => {
        this.getDataFromGarage();
        this.winnersPage.renderWinners();
        const objWinners = this.state.mainObject.winners;
        this.winnerListener();
        this.filterStateWinners(objWinners);
        const callback = async () => {
            const sortBy = 'id';
            const orderBy = 'ASC';
            const getWinnersData = (await this.api.getWinners(sortBy, orderBy)) as IWinner[];
            const getLen = getWinnersData.length;
            const getCars = (await this.api.getCars(getLen)) as IcreateCar[];
            const data = this.sortByWinners(getWinnersData, getCars);
            void Promise.all(data).then((value) => this.winnersPage.renderDataOfWinners(value));
        };
        void callback();
    };

    public renderPageWinner() {
        const bntWinnerPage = this.updateManager.getHTMLElement('navigation__winners');
        bntWinnerPage.addEventListener('click', this.referencePageWinner);
    }

    private changeArrow(value: HTMLElement, toggle: boolean, flag: string) {
        let iElement = value;
        if (!value.classList.contains('th__sort')) {
            iElement = value.querySelector('.th__sort') as HTMLElement;
        }
        if (!toggle) {
            flag === 'win' ? (this.state.mainObject.flagWinner = true) : (this.state.mainObject.flagTime = true);
            iElement.style.transform = `rotate(${45}deg`;
        } else {
            flag === 'win' ? (this.state.mainObject.flagWinner = false) : (this.state.mainObject.flagTime = false);
            iElement.style.transform = `rotate(${225}deg`;
        }
    }

    private winnerSoryByWins = (event: PointerEvent) => {
        const toggleFlag = this.state.mainObject.flagWinner;
        const callback = async () => {
            const value = event.target as HTMLElement;
            this.changeArrow(value, toggleFlag, 'win');

            if (this.toggleSortWinner) {
                const winnersBy = (await this.api.getWinners('wins', 'ASC')) as IWinner[];
                const getLen = winnersBy?.length;
                const getCars = (await this.api.getCars(Number(getLen))) as IcreateCar[];
                const data = this.sortByWinners(winnersBy, getCars);
                this.winnersPage.renderDataOfWinners(data);
                this.toggleSortWinner = false;
            } else {
                const winnersBy = (await this.api.getWinners('wins', 'DESC')) as IWinner[];
                const getLen = winnersBy?.length;
                const getCars = (await this.api.getCars(Number(getLen))) as IcreateCar[];
                const data = this.sortByWinners(winnersBy, getCars);
                this.winnersPage.renderDataOfWinners(data);
                this.toggleSortWinner = true;
            }
        };
        void callback();
    };

    private winnerSortByBestTime = (event: PointerEvent) => {
        const toggleFlag = this.state.mainObject.flagTime;
        const callback = async () => {
            const value = event.target as HTMLElement;
            this.changeArrow(value, toggleFlag, 'time');
            if (this.toggleTime) {
                const winnersBy = (await this.api.getWinners('time', 'ASC')) as IWinner[];
                const getLen = winnersBy?.length;
                const getCars = (await this.api.getCars(Number(getLen))) as IcreateCar[];
                const data = this.sortByWinners(winnersBy, getCars);
                this.winnersPage.renderDataOfWinners(data);
                this.toggleTime = false;
            } else {
                const winnersBy = (await this.api.getWinners('time', 'DESC')) as IWinner[];
                const getLen = winnersBy?.length;
                const getCars = (await this.api.getCars(Number(getLen))) as IcreateCar[];
                const data = this.sortByWinners(winnersBy, getCars);
                this.winnersPage.renderDataOfWinners(data);
                this.toggleTime = true;
            }
        };
        void callback();
    };

    public winnerListener() {
        const getAllTHElement = document.querySelectorAll('th');
        getAllTHElement[3].addEventListener('click', this.winnerSoryByWins as EventListener);
        getAllTHElement[4].addEventListener('click', this.winnerSortByBestTime as EventListener);
    }

    public getCarListner() {
        this.EventSelectCar();
        this.EventRemoveCar();
        this.EventStartCarMove();
        this.EventReturCarToPrevPosition();
    }

    public getSettingListener() {
        this.EventCreateCar();
        this.EventUpdateCar();
        this.EventInputCreaterContent();
        this.EventInputCreateColor();
        this.EventRaceCar();
        this.EventResetCar();
        this.EventGenerateManyCar();
    }

    public getAllListener() {
        this.EventCreateCar();
        this.EventUpdateCar();
        this.EventRaceCar();
        this.EventResetCar();
        this.EventGenerateManyCar();
        this.EventStartCarMove();
        this.EventReturCarToPrevPosition();
        this.EventSelectCar();
        this.EventRemoveCar();
        this.EventInputCreaterContent();
        this.EventInputCreateColor();
    }

    public async preloadCarItem() {
        try {
            const res = (await this.api.getCars(10000)) as IcreateCar[];
            this.state.mainObject.currentData.garageCount = Number(res.length);
            for (const key of res) {
                this.garagePage.renderCarItem(key);
            }
            Promise.all(res)
                .then((_) => {
                    this.renderPageGarage();
                    this.renderPageWinner();
                    this.getAllListener();
                })
                .catch((err: Error) => console.warn(err));
        } catch (err) {
            throw new Error('err in preloadCar');
        }
    }

    public preLoad() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updateManager.createHeaderFooter();
            this.garagePage.renderMainWrapper();
            this.garagePage.renderStatus();
            this.garagePage.renderGarageCreateCar();
            this.garagePage.renderGarageUpdate();
            this.garagePage.renderGarageSettingsBtn();
            this.garagePage.renderCarGarage();
            void this.preloadCarItem().then((_) => this.garagePage.updateGarage()); //initial render state
        });
    }

    public root() {
        this.preLoad();
    }
}

const getInstanceOfStateManager = SingletonReproducer.getInstance();
const api = new AdvancedApi(getInstanceOfStateManager);

const newApp: UpdateManager = new UpdateManager(getInstanceOfStateManager);
const garage: Garage = new Garage(newApp, getInstanceOfStateManager);
const winners: Winners = new Winners(newApp, getInstanceOfStateManager);
const app = new Manager(newApp, garage, winners, getInstanceOfStateManager, api);
app.root();
