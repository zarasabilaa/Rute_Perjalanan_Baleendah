import {
  createMap,
  addGeoJSON,
  fitMap,
  onMapClick
} from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/map.js";

import {
  getGeoJSON
} from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/geo.js";

import {
  findRoute
} from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/georoute.js";

// Elemen HTML
const elAwal = document.getElementById("titik-awal");
const elTujuan = document.getElementById("titik-tujuan");
const elJarak = document.getElementById("jarak");
const elTarif = document.getElementById("tarif");
const elPesan = document.getElementById("pesan");
const btnReset = document.getElementById("reset-rute");

// Konfigurasi aplikasi
const TARIF_SIMULASI = 10000;
const ID_PETA = "map";

let dataJalan = null;
let titikAwal = null;
let titikTujuan = null;

let hapusLapisanAwal = null;
let hapusLapisanTujuan = null;
let hapusLapisanRute = null;

// Membuat peta
createMap(ID_PETA, {
    center: [107.62087, -6.99996],
    zoom: 14
});

// Menampilkan status
function tampilkanPesan(teks) {
    elPesan.textContent = teks;
}

// Mengubah koordinat menjadi teks
function formatKoordinat(posisi) {
    if (!posisi) {
        return "Belum dipilih";
    }

    const [longitude, latitude] = posisi;

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

// Menampilkan tarif simulasi
function tampilkanTarif() {
    elTarif.textContent =
        "Rp" + TARIF_SIMULASI.toLocaleString("id-ID");
}

// Memperbarui informasi titik
function perbaruiTitik() {
    elAwal.textContent = formatKoordinat(titikAwal);
    elTujuan.textContent = formatKoordinat(titikTujuan);
}

// Menghapus lapisan marker dan rute sebelumnya
function hapusLapisanPilihan() {
    if (hapusLapisanAwal) {
        hapusLapisanAwal();
        hapusLapisanAwal = null;
    }

    if (hapusLapisanTujuan) {
        hapusLapisanTujuan();
        hapusLapisanTujuan = null;
    }

    if (hapusLapisanRute) {
        hapusLapisanRute();
        hapusLapisanRute = null;
    }
}

// Menghapus satu lapisan rute
function hapusRuteSaja() {
    if (hapusLapisanRute) {
        hapusLapisanRute();
        hapusLapisanRute = null;
    }
}

// Menggambar marker titik awal
function gambarTitikAwal() {
    hapusLapisanAwal = addGeoJSON(
        ID_PETA,
        {
            type: "Feature",
            properties: {
                nama: "Titik awal"
            },
            geometry: {
                type: "Point",
                coordinates: titikAwal
            }
        },
        {
            style: {
                fill: "#16a34a",
                stroke: "#ffffff",
                strokeWidth: 3,
                radius: 9
            },
            popup: "Titik awal"
        }
    );
}

// Menggambar marker tujuan
function gambarTitikTujuan() {
    hapusLapisanTujuan = addGeoJSON(
        ID_PETA,
        {
            type: "Feature",
            properties: {
                nama: "Titik tujuan"
            },
            geometry: {
                type: "Point",
                coordinates: titikTujuan
            }
        },
        {
            style: {
                fill: "#dc2626",
                stroke: "#ffffff",
                strokeWidth: 3,
                radius: 9
            },
            popup: "Titik tujuan"
        }
    );
}

// Menghitung rute terpendek pada jaringan jalan
function hitungRute() {
    if (!titikAwal || !titikTujuan || !dataJalan) {
        return;
    }

    hapusRuteSaja();

    tampilkanPesan("Menghitung rute terpendek...");

    try {
        const rute = findRoute(
            titikAwal,
            titikTujuan,
            dataJalan
        );

        if (!rute) {
            elJarak.textContent = "-";

            tampilkanPesan(
                "Rute tidak ditemukan. Data jalan mungkin tidak saling terhubung."
            );

            return;
        }

        // Gambar garis rute di atas peta
        hapusLapisanRute = addGeoJSON(
            ID_PETA,
            rute,
            {
                style: {
                    stroke: "#2563eb",
                    strokeWidth: 6,
                    strokeOpacity: 1
                },
                popup: "Rute perjalanan"
            }
        );

        // distance dari CrootJS dinyatakan dalam meter
        const jarakMeter = rute.properties.distance;
        const jarakKm = jarakMeter / 1000;

        elJarak.textContent = `${jarakKm.toFixed(2)} km`;
        tampilkanTarif();

        tampilkanPesan(
            "Rute berhasil ditemukan. Tarif Rp10.000 adalah tarif simulasi."
        );

        console.log("GeoJSON rute:", rute);
        console.log("Jarak rute (meter):", jarakMeter);
    } catch (error) {
        console.error("Gagal menghitung rute:", error);

        elJarak.textContent = "-";

        tampilkanPesan(
            "Terjadi kesalahan saat menghitung rute. Periksa console browser."
        );
    }
}

// Memilih titik melalui klik peta
function pilihTitik(posisi) {
    // Klik pertama atau klik ketiga dan seterusnya
    // memulai pasangan titik yang baru.
    if (!titikAwal || titikTujuan) {
        hapusLapisanPilihan();

        titikAwal = posisi;
        titikTujuan = null;

        elJarak.textContent = "-";

        gambarTitikAwal();
        perbaruiTitik();

        tampilkanPesan(
            "Titik awal dipilih. Klik peta sekali lagi untuk memilih tujuan."
        );

        return;
    }

    // Klik kedua menetapkan tujuan
    titikTujuan = posisi;

    gambarTitikTujuan();
    perbaruiTitik();
    hitungRute();
}

// Reset agar pengguna dapat memilih rute baru
function resetRute() {
    hapusLapisanPilihan();

    titikAwal = null;
    titikTujuan = null;

    elJarak.textContent = "-";

    perbaruiTitik();
    tampilkanTarif();

    tampilkanPesan("Pilih titik awal pada peta.");
}

// Muat GeoJSON jalan dari folder proyek
function muatJalan() {
    tampilkanPesan("Memuat data jalan Baleendah...");

    getGeoJSON("./jalan.geojson", (response) => {
        if (!response.data) {
            console.error(
                "Gagal memuat GeoJSON. Status:",
                response.status
            );

            tampilkanPesan(
                "Data jalan gagal dimuat. Periksa nama file, URL, dan koneksi."
            );

            return;
        }

        dataJalan = response.data;

        const jumlahFitur = dataJalan.features.length;

        console.log("GeoJSON berhasil dimuat:", dataJalan);
        console.log("Jumlah fitur jalan:", jumlahFitur);

        addGeoJSON(
            ID_PETA,
            dataJalan,
            {
                style: {
                    stroke: "#64748b",
                    strokeWidth: 3,
                    strokeOpacity: 0.9
                },
                popup: (feature) => {
                    const properti = feature.properties || {};

                    return (
                        properti.name ||
                        properti.nama ||
                        properti.highway ||
                        "Ruas jalan"
                    );
                }
            }
        );

        fitMap(ID_PETA, dataJalan);

        // Aktifkan pemilihan titik setelah data siap
        onMapClick(ID_PETA, (posisi) => {
            pilihTitik(posisi);
        });

        tampilkanPesan(
            `Data jalan siap (${jumlahFitur} fitur). Klik peta untuk memilih titik awal.`
        );
    });
}

// Event tombol reset
btnReset.addEventListener("click", resetRute);

// Inisialisasi tampilan
perbaruiTitik();
tampilkanTarif();
muatJalan();
