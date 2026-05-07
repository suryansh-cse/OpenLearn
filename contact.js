(function () {
  const form = document.getElementById("contactForm");
  const statusMessage = document.getElementById("contactStatus");
  const apiBaseUrl =
    window.location.protocol === "file:" || window.location.port !== "3000"
      ? "http://localhost:3000"
      : "";

  if (!form) {
    return;
  }

  async function checkApiHealth() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const type = document.getElementById("contact-type").value.trim();
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const message = document.getElementById("contact-message").value.trim();

    if (!name || !email || !message) {
      if (statusMessage) {
        statusMessage.textContent = "Please fill in your name, email, and message.";
        statusMessage.className = "form-status error";
      }
      return;
    }

    if (statusMessage) {
      statusMessage.textContent = "Saving your message...";
      statusMessage.className = "form-status";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const serverReady = await checkApiHealth();

      if (!serverReady) {
        throw new Error("Local server is not running. Start it with 'npm start' or double-click 'start-openlearn.bat', then open http://localhost:3000/contact.html.");
      }

      const response = await fetch(`${apiBaseUrl}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type,
          name,
          email,
          message
        })
      });

      const rawResponse = await response.text();
      let result = {};

      if (rawResponse.trim()) {
        try {
          result = JSON.parse(rawResponse);
        } catch (parseError) {
          throw new Error("The server returned an invalid response. Make sure OpenLearn is running with the local server.");
        }
      }

      if (!response.ok) {
        throw new Error(result.error || "Unable to save your message.");
      }

      form.reset();

      if (statusMessage) {
        statusMessage.textContent = "Your message has been saved successfully.";
        statusMessage.className = "form-status success";
      }
    } catch (error) {
      const friendlyMessage =
        error && error.message === "Failed to fetch"
          ? "Unable to reach the local server. Start it with 'npm start' or double-click 'start-openlearn.bat', then open http://localhost:3000/contact.html."
          : error.message || "Something went wrong while saving your message.";

      if (statusMessage) {
        statusMessage.textContent = friendlyMessage;
        statusMessage.className = "form-status error";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
})();
