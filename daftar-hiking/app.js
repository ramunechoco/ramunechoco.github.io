(function () {
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxVDJRDkdEFP1lXYsXdlUrMVWAIQzIk75Ql31RKt3mJVkPgoXKq2lHkgMNlS2hizr5L/exec";
  var TZ = "Asia/Jakarta";
  var DEBOUNCE_MS = 300;

  var el = {
    app: document.getElementById("app"),
    loading: document.getElementById("loading"),
    fatal: document.getElementById("fatal"),
    location: document.getElementById("location"),
    date: document.getElementById("date"),
    countNum: document.getElementById("count-num"),
    countLbl: document.getElementById("count-lbl"),
    msg: document.getElementById("msg"),
    form: document.getElementById("form"),
    fields: document.getElementById("fields"),
    name: document.getElementById("name"),
    party: document.getElementById("party"),
    phone: document.getElementById("phone"),
    submit: document.getElementById("submit")
  };

  var counts = {};
  var countsToken = 0;
  var dateTimer = null;

  function jakartaToday() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  }

  function plusOneYear(iso) {
    var p = iso.split("-");
    return (Number(p[0]) + 1) + "-" + p[1] + "-" + p[2];
  }

  function hideLoading() {
    el.loading.hidden = true;
  }

  function showApp() {
    hideLoading();
    el.app.hidden = false;
  }

  function showFatal(text) {
    hideLoading();
    el.fatal.textContent = text;
    el.fatal.hidden = false;
    el.app.hidden = true;
  }

  function showMsg(text, kind) {
    el.msg.textContent = text;
    el.msg.className = "msg " + kind;
    el.msg.hidden = false;
  }

  function clearMsg() {
    el.msg.hidden = true;
  }

  function request(url, options) {
    return fetch(url, options).then(function (res) {
      return res.json();
    }).then(function (payload) {
      if (!payload || payload.ok !== true) {
        var m = payload && payload.error && payload.error.message;
        throw new Error(m || "Terjadi kesalahan pada server.");
      }
      return payload.data;
    });
  }

  function requestRetry(url, attempts) {
    attempts = attempts || 3;
    return request(url).catch(function (e) {
      if (attempts <= 1) throw e;
      return new Promise(function (resolve) {
        setTimeout(resolve, 1000);
      }).then(function () {
        return requestRetry(url, attempts - 1);
      });
    });
  }

  function renderLocations(list) {
    el.location.innerHTML = "";
    list.forEach(function (loc) {
      var opt = document.createElement("option");
      opt.value = String(loc.id);
      opt.textContent = loc.name;
      el.location.appendChild(opt);
    });
  }

  function setCount(total) {
    var n = Number(total) || 0;
    el.countNum.textContent = String(n);
    el.countLbl.textContent = n === 0
      ? "belum ada pendaki terdaftar"
      : "pendaki terdaftar pada tanggal ini";
  }

  function renderCount() {
    var id = el.location.value;
    if (!id) {
      el.countNum.textContent = "—";
      el.countLbl.textContent = "pendaki terdaftar";
      return;
    }
    setCount(counts[id]);
  }

  function pending() {
    el.countNum.textContent = "…";
    el.countLbl.textContent = "menghitung…";
  }

  function loadCounts() {
    var date = el.date.value;
    if (!date) return;
    var token = ++countsToken;
    pending();
    return requestRetry(ENDPOINT + "?action=counts&date=" + encodeURIComponent(date))
      .then(function (data) {
        if (token !== countsToken) return;
        counts = data.counts || {};
        renderCount();
      })
      .catch(function (e) {
        if (token !== countsToken) return;
        el.countNum.textContent = "—";
        el.countLbl.textContent = e.message || "gagal memuat jumlah pendaki";
      });
  }

  function submit(event) {
    event.preventDefault();
    clearMsg();

    var name = el.name.value.trim();
    var party = Number(el.party.value);
    var phone = el.phone.value.trim();

    if (!el.location.value) { showMsg("Pilih lokasi terlebih dahulu.", "error"); return; }
    if (!el.date.value) { showMsg("Pilih tanggal pendakian terlebih dahulu.", "error"); return; }
    if (!name) { showMsg("Nama wajib diisi.", "error"); el.name.focus(); return; }
    if (!Number.isInteger(party) || party < 1 || party > 200) {
      showMsg("Jumlah pendaki harus berupa angka antara 1 dan 200.", "error");
      el.party.focus();
      return;
    }

    el.fields.disabled = true;
    el.submit.textContent = "Mengirim…";

    request(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        location_id: Number(el.location.value),
        date: el.date.value,
        name: name,
        party_size: party,
        phone: phone
      })
    }).then(function (data) {
      countsToken++;
      counts = data.counts || {};
      renderCount();
      el.form.reset();
      el.party.value = "1";
      showMsg("Pendaftaran berhasil. Selamat mendaki!", "ok");
    }).catch(function (e) {
      showMsg(e.message || "Gagal mengirim pendaftaran. Coba lagi.", "error");
    }).then(function () {
      el.fields.disabled = false;
      el.submit.textContent = "Daftar";
    });
  }

  function start() {
    var today = jakartaToday();
    el.date.min = today;
    el.date.max = plusOneYear(today);
    el.date.value = today;

    el.location.addEventListener("change", function () {
      clearMsg();
      renderCount();
    });

    el.date.addEventListener("change", function () {
      clearMsg();
      pending();
      if (dateTimer) clearTimeout(dateTimer);
      dateTimer = setTimeout(loadCounts, DEBOUNCE_MS);
    });

    el.form.addEventListener("submit", submit);

    requestRetry(ENDPOINT + "?action=init&date=" + encodeURIComponent(today))
      .then(function (data) {
        var list = data.locations || [];
        if (!list.length) throw new Error("Belum ada lokasi yang tersedia.");
        renderLocations(list);
        counts = data.counts || {};
        showApp();
        renderCount();
      })
      .catch(function (e) {
        showFatal("Gagal memuat halaman. Periksa koneksi Anda lalu muat ulang halaman.");
      });
  }

  start();
})();
