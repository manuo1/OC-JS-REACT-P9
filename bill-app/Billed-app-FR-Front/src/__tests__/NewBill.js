/**
 * @jest-environment jsdom
 */
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as Employee on NewBill page", () => {
  beforeEach(() => {
    // Mock localStorage to simulate user authentication
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

    // Inject UI to simulate the NewBill page
    document.body.innerHTML = NewBillUI();

    // Mock Navigation function for testing route changes
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
      // Get the file input element
      const fileInput = screen.getByTestId("file");

      // Create a mock valid image file
      const validFile = new File(["some content"], "image.png", { type: "image/png" });

      // Mock the alert function to verify it's not called
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Simulate user uploading a valid file
      userEvent.upload(fileInput, validFile);

      // Assert that the file was accepted (name matches)
      expect(fileInput.files[0].name).toBe("image.png");

      // Ensure no alert was shown for valid file
      expect(alertMock).not.toHaveBeenCalled();

      // Clean up the mock
      alertMock.mockRestore();
    });

    /**
     * Test case: Invalid file upload
     * Ensures the system rejects files with non-image extensions and displays an alert
     */
    test("Then it should reject invalid file types", async () => {
      // Get the file input element
      const fileInput = screen.getByTestId("file");

      // Create a mock invalid file (PDF)
      const invalidFile = new File(["some content"], "document.pdf", { type: "application/pdf" });

      // Mock the alert function to verify it's called
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Simulate user uploading an invalid file
      userEvent.upload(fileInput, invalidFile);

      // Assert that an alert was shown for invalid file type
      expect(alertMock).toHaveBeenCalled();

      // Ensure the input was cleared after rejection
      expect(fileInput.value).toBe("");

      // Clean up the mock
      alertMock.mockRestore();
    });
  });
});
