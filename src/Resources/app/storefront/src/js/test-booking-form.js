/**
 * HOREX Booking Form Test Script
 *
 * Fügt automatisch Testdaten in das Buchungsformular ein.
 *
 * Verwendung:
 * 1. Öffne die Probefahrt-Seite: http://localhost/de/probefahrt
 * 2. Öffne die Browser-Konsole (F12)
 * 3. Kopiere und füge dieses Skript ein
 * 4. Drücke Enter
 *
 * Das Formular wird automatisch ausgefüllt und kann dann abgesendet werden.
 */

(function () {
  "use strict";

  console.log("[BookingFormTest] Starting auto-fill...");

  // Find form
  const form = document.querySelector("#hero-booking-form");
  if (!form) {
    console.error(
      "[BookingFormTest] Form not found! Make sure you are on the Probefahrt page."
    );
    return;
  }

  /**
   * Helper: Set select value by option text or value
   */
  function setSelectValue(name, searchValue) {
    const select = form.querySelector(`[name="${name}"]`);
    if (!select) {
      console.warn(`[BookingFormTest] Select "${name}" not found`);
      return false;
    }

    const options = select.querySelectorAll("option");
    for (const option of options) {
      // Match by value or text content (case-insensitive)
      if (
        option.value === searchValue ||
        option.textContent.trim().toLowerCase() === searchValue.toLowerCase() ||
        option.textContent
          .trim()
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      ) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(
          `[BookingFormTest] ✓ Set ${name} = "${option.textContent.trim()}" (${
            option.value
          })`
        );
        return true;
      }
    }
    console.warn(
      `[BookingFormTest] ✗ Option "${searchValue}" not found for ${name}`
    );
    return false;
  }

  /**
   * Helper: Set input value
   */
  function setInputValue(name, value) {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) {
      console.warn(`[BookingFormTest] Input "${name}" not found`);
      return false;
    }

    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[BookingFormTest] ✓ Set ${name} = "${value}"`);
    return true;
  }

  // Test data - uses text matching for dropdowns (not hardcoded IDs!)
  const testData = {
    // Dropdowns - matched by visible text
    model: "Regina Evo", // or 'VR6'
    preferredLocation: "Abholort", // Matches 'Abholort 1' or 'Abholort 2'
    salutation: "Herr", // Uses text, not UUID!

    // Text inputs
    zip: "86899 Landsberg am Lech",
    title: "Dr.",
    firstName: "Max",
    lastName: "Mustermann",
    email: "max.mustermann@test.de",
    phone: "+49 170 1234567",
    comment:
      "Ich interessiere mich für eine Probefahrt mit der Regina Evo. Bitte kontaktieren Sie mich für einen Termin.\n\nTest-Nachricht von Cursor AI.",
  };

  // Fill form fields
  console.log("[BookingFormTest] Filling form fields...");

  // Dropdowns - use text matching
  setSelectValue("model", testData.model);
  setSelectValue("preferredLocation", testData.preferredLocation);
  setSelectValue("salutationId", testData.salutation); // Uses "Herr" text, finds correct UUID

  // Text inputs
  setInputValue("zip", testData.zip);
  setInputValue("title", testData.title);
  setInputValue("firstName", testData.firstName);
  setInputValue("lastName", testData.lastName);
  setInputValue("email", testData.email);
  setInputValue("phone", testData.phone);
  setInputValue("comment", testData.comment);

  console.log("[BookingFormTest] ✅ Form filled successfully!");
  console.log('[BookingFormTest] Click "Probefahrt anfragen" to submit.');
  console.log(
    '[BookingFormTest] Or run: document.querySelector("#hero-booking-form button[type=submit]").click()'
  );
})();
