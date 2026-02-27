const submitBtn = document.getElementById("submitBtn");
const input = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const statusElm = document.getElementById("status");
let imageId;

submitBtn.addEventListener("click", async (e) => {
  const file = input.files[0];
  if (!file) {
    statusElm.textContent = "Status: No file selected";
    return;
  }
  const { name, size, type } = file;
  try {
    const tempPreview = URL.createObjectURL(file);
    preview.src = tempPreview;

    const response = await fetch(`/api/v1/images/upload`, {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": type,
        "Content-Length": size,
        "x-File-Name": name,
        Accept: "application/json",
      },
    });

    const result = await response.json();
    console.log(result)
    const { jobId, imageId: imageIdValue } = result.data
    imageId = imageIdValue;
    statusElm.textContent = `Status: Upload successful. Job ID: ${jobId}`;

    startSse(jobId);
  } catch (error) {
    statusElm.textContent = `Status: Error uploading file: ${error.message}`;
    preview.src = "";
  }
});

const startSse = (jobId) => {
    console.log(jobId);
    
  const eventSource = new EventSource(`/api/v1/jobs/status/event/${jobId}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data).data;

    statusElm.textContent = `Status: ${data.status} - ${data.completedAt ? new Date(data.completedAt).toLocaleString() : ""}`;

    if (data.status === "SUCCESS") {
        eventSource.close();
        preview.src = data.previewUrl || `/api/v1/images/preview/${imageId}`;
    }else if(data.status === "FAILED"){
        eventSource.close();
        statusElm.textContent = `Status: Job failed - ${data.error || "Job Failed"}`;
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE error:", err);
    statusElm.textContent = "Status: SSE connection error";
  };
};
