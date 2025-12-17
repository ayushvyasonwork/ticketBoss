const URL = "http://localhost:5000/api/reservations";

async function runConcurrencyTest() {
  const requests = [];

  for (let i = 1; i <= 4; i++) {
    requests.push(
      fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          partnerId: `partner-${i}`,
          seats: 3
        })
      }).then(async res => ({
        status: res.status,
        body: await res.json().catch(() => ({}))
      }))
    );
  }

  const results = await Promise.all(requests);

  console.table(
    results.map((r, i) => ({
      request: i + 1,
      status: r.status,
      message: r.body.error || "CONFIRMED"
    }))
  );
}

runConcurrencyTest();
