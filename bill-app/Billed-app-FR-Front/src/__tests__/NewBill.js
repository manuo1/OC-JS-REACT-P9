/**
 * @jest-environment jsdom
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";

describe("Given I am connected as Employee on NewBill page", () => {
  beforeEach(() => {
    // Mock localStorage to simulate user authentication
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

    // Inject UI to simulate the NewBill page
    document.body.innerHTML = NewBillUI();

    // Mock navigation function for testing route changes
    const onNavigate = jest.fn();

    // Initialize NewBill component with mocks to ensure event handlers are attached
    new NewBill({
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
    /**
     * Test case: Valid file upload
     * Ensures the system accepts image files with proper extensions (jpg, jpeg, png)
     */
    test("Then it should accept valid image file types (jpg, jpeg or png extension)", async () => {
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["some content"], "image.png", { type: "image/png" });

      // Spy on window.alert to ensure it's not called
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Simulate file upload
      userEvent.upload(fileInput, validFile);

      // Assert file is accepted
      expect(fileInput.files[0].name).toBe("image.png");
      expect(alertMock).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });

    /**
     * Test case: Invalid file upload
     * Ensures the system rejects files with invalid types and displays an alert
     */
    test("Then it should reject invalid file types", async () => {
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["some content"], "document.pdf", { type: "application/pdf" });

      // Spy on alert to check if it's called
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Simulate file upload
      userEvent.upload(fileInput, invalidFile);

      // Assert rejection and alert call
      expect(alertMock).toHaveBeenCalled();
      expect(fileInput.value).toBe("");

      alertMock.mockRestore();
    });

    /**
     * Test group for form submission
     * Verifies that valid form data triggers update and navigation
     */
    describe("and I submit the form", () => {
      /**
       * Test case: Submit form with valid data
       * Ensures updateBill is called and user is redirected to Bills page
       */
      test("Then it should call updateBill and navigate to Bills page", async () => {
        const onNavigate = jest.fn();

        // Re-initialize component to attach a fresh instance
        const newBillInstance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Fill form fields with valid data
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

        // Simulate form submission
        const form = screen.getByTestId("form-new-bill");
        form.dispatchEvent(new Event("submit"));

        // Assert updateBill was called
        expect(updateSpy).toHaveBeenCalled();

        // Assert navigation to Bills page
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
      });
    });
  });
});
