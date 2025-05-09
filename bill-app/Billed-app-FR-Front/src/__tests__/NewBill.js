/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as Employee on NewBill page", () => {
  let newBillInstance;
  const onNavigate = jest.fn();

  beforeEach(() => {
    // Mock localStorage to simulate user authentication
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

    // Inject UI to simulate the NewBill page
    document.body.innerHTML = NewBillUI();

    // Initialize NewBill component with mocks to ensure event handlers are attached
    newBillInstance = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
  });

  /**
   * Test group for file upload functionality
   * Verifies correct behavior for both valid and invalid file types
   */
  describe("and I upload a file", () => {
    test("Then it should accept valid image file types (jpg, jpeg or png extension)", async () => {
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["some content"], "image.png", { type: "image/png" });

      // Spy on store.bills.create to check if it's called
      const createSpy = jest.spyOn(mockStore.bills(), "create");

      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Submit upload
      userEvent.upload(fileInput, validFile);

      // when user upload a file "empty" bill is created with file
      expect(createSpy).toHaveBeenCalled();

      expect(fileInput.files[0].name).toBe("image.png");
      expect(alertMock).not.toHaveBeenCalled();
      alertMock.mockRestore();
    });

    test("Then it should reject invalid file types", async () => {
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["some content"], "document.pdf", { type: "application/pdf" });

      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      userEvent.upload(fileInput, invalidFile);

      expect(alertMock).toHaveBeenCalled();
      expect(fileInput.value).toBe("");
      alertMock.mockRestore();
    });
  });

  /**
   * Test group for form submission
   * Verifies that valid form data triggers update and navigation
   */
  describe("and I submit the form", () => {
    test("Then it should save the bill and navigate to Bills page", async () => {
      // Fill Form
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Train Paris";
      screen.getByTestId("amount").value = "100";
      screen.getByTestId("datepicker").value = "2024-05-05";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "10";
      screen.getByTestId("commentary").value = "Voyage pro";

      // Mock file already uploaded
      newBillInstance.fileUrl = "https://localhost/image.png";
      newBillInstance.fileName = "image.png";

      // Spy on store.bills.update to check if it's called
      const updateSpy = jest.spyOn(mockStore.bills(), "update");

      // Submit Form
      const form = screen.getByTestId("form-new-bill");
      form.dispatchEvent(new Event("submit"));

      // Wait for redirection
      await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills));

      // When the user submits the form, the bill created when the file was uploaded is updated with the form data.
      expect(updateSpy).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: "Transports",
          name: "Train Paris",
          amount: 100,
          date: "2024-05-05",
          vat: "20",
          pct: 10,
          commentary: "Voyage pro",
          fileUrl: "https://localhost/image.png",
          fileName: "image.png",
          status: "pending",
        }),
        selector: null,
      });
    });
  });

  /**
   * Note: If we need to test error cases (e.g., 500 or 404) during the form submission,
   * we need to change NewBill methods (handleChangeFile, handleSubmit  and updateBill)
   * to avoid hiding errors.
   * Currently, both methods only log errors to the console without displaying
   * any feedback to the user or preventing navigation.
   */
});
