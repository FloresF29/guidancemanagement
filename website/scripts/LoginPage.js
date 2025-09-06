document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab");
  const submitBtn = document.querySelector(".submit-btn");
  const textInput = document.getElementById("text");
  const form = document.querySelector("form");

  let currentRole = "Student";

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
         tabs.forEach(t => t.classList.remove("active"));
         tab.classList.add("active");

         currentRole = tab.textContent;
         submitBtn.textContent = `Sign in as ${currentRole} Portal`;
         
         if (currentRole === "Student") {
            textInput.type = "text";
           textInput.placeholder = " Enter your LRN ";
           textInput.readOnly = false;
         } else if (currentRole === "Admin") {
            textInput.type = " text";
            textInput.placeholder = " Enter your Admin ID ";
            textInput.readOnly = false;
         }
      });
  });

  form.addEventListener("submit",function (e) {
    e.preventDefault();

    const text = textInput.value.trim();
    const password = document.getElementById("password").value.trim();

    if (!text || !password) {
      alert("Please complete all required fields.");
      return;
    }   

    console.log(`Logging in as ${currentRole}:`);
    console.log(`LRN/Username: ${text}`);
    console.log(`Password: ${password}`);
  });
});