/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

/**
 * Test suite for the Bills page when user is authenticated as an Employee
 */
describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mock localStorage to simulate authenticated Employee
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
  });

  /**
   * Test group for interactions and UI behavior on the Bills page
   */
  describe("When I am on Bills Page", () => {
    /**
     * Test case: The vertical navigation icon should be highlighted
     * Verifies that the icon for the Bills page is active
     */
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    /**
     * Test case: Bills should be ordered from latest to earliest
     * Ensures that displayed bills are sorted in reverse chronological order
     */
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);

      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });

    /**
     * Test case: Clicking on "New Bill" button should navigate to NewBill page
     */
    test("Then clicking on 'New Bill' should navigate to NewBill page", () => {
      const onNavigate = jest.fn();
      document.body.innerHTML = BillsUI({ data: bills });

      const billsInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const newBillBtn = screen.getByTestId("btn-new-bill");
      newBillBtn.click();

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    /**
     * Test case: Clicking on the eye icon should open the modal
     * Verifies that the modal is triggered upon clicking the icon
     */
    test("Then clicking on the eye icon should display the modal", () => {
      // Mock jQuery modal method
      $.fn.modal = jest.fn();

      document.body.innerHTML = BillsUI({ data: bills });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      billsInstance.handleClickIconEye(iconEye);

      expect($.fn.modal).toHaveBeenCalledWith("show");
    });

    /**
     * Test case: getBills method should return formatted bills
     * Ensures the method correctly fetches and formats the bills data
     */
    test("Then getBills should return formatted bills", async () => {
      const storeMock = {
        bills: () => ({
          list: () => Promise.resolve(bills),
        }),
      };

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: storeMock,
        localStorage: window.localStorage,
      });

      const billsData = await billsInstance.getBills();

      expect(billsData[0]).toHaveProperty("date");
      expect(billsData[0]).toHaveProperty("status");
    });
  });
});

/**
 * Test suite for the Bills page : GET
 */
describe("Given I am connected as an employee", () => {
  describe("When I navigate to Bills", () => {
    /**
     * Test case: fetches bills from mock API GET
     * Ensures that bills are correctly fetched and displayed
     */
    test("fetches bills from mock API GET", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // Wait for the DOM to update and check that all items are displayed
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("encore")).toBeTruthy();
      expect(screen.getByText("test1")).toBeTruthy();
      expect(screen.getByText("test2")).toBeTruthy();
      expect(screen.getByText("test3")).toBeTruthy();
    });
    /**
     * Test group for error handling during API calls
     */
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");

        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
      });

      /**
       * Test case: fetches bills from an API and fails with 404 message error
       * Verifies that the application displays the correct error message
       */
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 404")),
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        // Wait for the next tick to ensure DOM is updated
        await new Promise(process.nextTick);

        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      /**
       * Test case: fetches bills from an API and fails with 500 message error
       * Verifies that the application displays the correct error message
       */
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 500")),
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        // Wait for the next tick to ensure DOM is updated
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
