(function () {
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxVDJRDkdEFP1lXYsXdlUrMVWAIQzIk75Ql31RKt3mJVkPgoXKq2lHkgMNlS2hizr5L/exec";
  var CACHE_KEY = "daftar-hiking:locations:v1";
  var TZ = "Asia/Jakarta";

  var el = {
    app: document.getElementById("app"),
    loading: document.getElementById("loading"),
    fatal: document.getElementById("fatal"),
    notice: document.getElementById("notice"),
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

  function showNotice(text) {
    el.notice.textContent = text;
    el.notice.hidden = false;
  }

  function clearNotice() {
    el.notice.hidden = true;
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

  function renderLocations(list) {
    var previous = el.location.value;
    el.location.innerHTML = "";
    list.forEach(function (loc) {
      var opt = document.createElement("option");
      opt.value = String(loc.id);
      opt.textContent = loc.name;
      el.location.appendChild(opt);
    });
    if (previous && list.some(function (l) { return String(l.id) === previous; })) {
      el.location.value = previous;
    }
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (e) {
      return null;
    }
  }
  function writeCache(list) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch (e) { }
  }

  var countToken = 0;

  function refreshCount() {
    var locationId = el.location.value;
    var date = el.date.value;
    if (!locationId || !date) {
      el.countNum.textContent = "—";
      return;
    }
    var token = ++countToken;
    el.countNum.textContent = "…";
    el.countLbl.textContent = "menghitung…";

    var url = ENDPOINT + "?action=count&location_id=" + encodeURIComponent(locationId) +
              "&date=" + encodeURIComponent(date);

    request(url).then(function (data) {
      if (token !== countToken) return;
      setCount(data.total_hikers);
    }).catch(function (e) {
      if (token !== countToken) return;
      el.countNum.textContent = "—";
      el.countLbl.textContent = "gagal memuat jumlah pendaki";
    });
  }

  function setCount(total) {
    var n = Number(total) || 0;
    el.countNum.textContent = String(n);
    el.countLbl.textContent = n === 0
      ? "belum ada pendaki terdaftar"
      : "pendaki terdaftar pada tanggal ini";
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
      countToken++;
      setCount(data.total_hikers);
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

    el.location.addEventListener("change", function () { clearMsg(); refreshCount(); });
    el.date.addEventListener("change", function () { clearMsg(); refreshCount(); });
    el.form.addEventListener("submit", submit);

    var cached = readCache();
    if (cached) {
      renderLocations(cached);
      showApp();
      refreshCount();
    }

    request(ENDPOINT + "?action=bootstrap").then(function (data) {
      var list = data.locations || [];
      if (!list.length) throw new Error("Belum ada lokasi yang tersedia.");
      writeCache(list);
      clearNotice();
      var changed = !cached || JSON.stringify(cached) !== JSON.stringify(list);
      if (changed) {
        renderLocations(list);
        showApp();
        refreshCount();
      }
    }).catch(function (e) {
      if (cached) {
        showNotice("Daftar lokasi mungkin belum yang terbaru. Sambungan ke server sedang bermasalah.");
      } else {
        showFatal("Gagal memuat daftar lokasi. Periksa koneksi Anda lalu muat ulang halaman.");
      }
    });
  }

  start();
})();
