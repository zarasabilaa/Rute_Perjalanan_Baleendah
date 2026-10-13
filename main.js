
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

// ========================================
// 1. ELEMEN HTML
// ========================================

const elAwal = document.getElementById("titik-awal");
const elTujuan = document.getElementById("titik-tujuan");
const elJarak = document.getElementById("jarak");
const elTarif = document.getElementById("tarif");
const elPesan = document.getElementById("pesan");
const btnReset = document.getElementById("reset-rute");

// Pastikan ID elemen HTML sesuai
if (
    !elAwal ||
    !elTujuan ||
    !elJarak ||
    !elTarif ||
    !elPesan ||
    !btnReset
) {
    throw new Error(
        "Elemen HTML tidak ditemukan. Periksa ID di index.html."
    );
}

// ========================================
// 2. KONFIGURASI APLIKASI
// ========================================

const TARIF_SIMULASI = 10000;
const ID_PETA = "map";

let dataJalan = null;
let titikAwal = null;
let titikTujuan = null;

let hapusLapisanJalan = null;
let hapusLapisanAwal = null;
let hapusLapisanTujuan = null;
let hapusLapisanRute = null;

// ========================================
// 3. MEMBUAT PETA
// ========================================

createMap(ID_PETA, {
    center: [107.62087, -6.99996],
    zoom: 14
});

// ========================================
// 4. FUNGSI BANTU
// ========================================

function tampilkanPesan(teks) {
    elPesan.textContent = teks;
}

function formatKoordinat(posisi) {
    if (!posisi) {
        return "Belum dipilih";
    }

    const [longitude, latitude] = posisi;

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function tampilkanTarif() {
    elTarif.textContent =
        "Rp" + TARIF_SIMULASI.toLocaleString("id-ID");
}

function perbaruiTitik() {
    elAwal.textContent = formatKoordinat(titikAwal);
    elTujuan.textContent = formatKoordinat(titikTujuan);
}

// ========================================
// 5. MENGHAPUS LAPISAN
// ========================================

function hapusLapisanPilihan() {
    if (hapusLapisanAwal) {
        hapusLapisanAwal();
        hapusLapisanAwal = null;
    }

    if (hapusLapisanTujuan) {
        hapusLapisanTujuan();
        hapusLapisanTujuan = null;
    }

    hapusRuteSaja();
}

function hapusRuteSaja() {
    if (hapusLapisanRute) {
        hapusLapisanRute();
        hapusLapisanRute = null;
    }
}

// ========================================
// 6. MENGGAMBAR TITIK AWAL
// ========================================

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

// ========================================
// 7. MENGGAMBAR TITIK TUJUAN
// ========================================

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

// ========================================
// 8. MENGHITUNG RUTE TERPENDEK
// ========================================

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
                "Rute tidak ditemukan. Periksa apakah ruas jalan saling terhubung."
            );

            console.warn(
                "Rute tidak ditemukan. Periksa konektivitas koordinat GeoJSON."
            );

            return;
        }

        console.log("GeoJSON rute hasil perhitungan:", rute);

        hapusLapisanRute = addGeoJSON(
            ID_PETA,
            rute,
            {
                style: {
                    stroke: "#2563eb",
                    strokeWidth: 7,
                    strokeOpacity: 1,
                    fillOpacity: 0
                },
                popup: "Rute perjalanan"
            }
        );

        const jarakMeter = rute.properties?.distance;

        if (
            typeof jarakMeter !== "number" ||
            !Number.isFinite(jarakMeter)
        ) {
            elJarak.textContent = "-";

            tampilkanPesan(
                "Rute terbentuk, tetapi informasi jarak tidak tersedia."
            );

            console.warn(
                "Properti distance tidak ditemukan pada hasil rute."
            );

            return;
        }

        const jarakKm = jarakMeter / 1000;

        elJarak.textContent = `${jarakKm.toFixed(2)} km`;
        tampilkanTarif();

        tampilkanPesan(
            "Rute berhasil ditemukan. Tarif Rp10.000 merupakan tarif simulasi."
        );

        console.log("Jarak rute:", jarakMeter, "meter");
    } catch (error) {
        console.error("Gagal menghitung rute:", error);

        elJarak.textContent = "-";

        tampilkanPesan(
            "Gagal menghitung rute. Periksa pesan error di Console."
        );
    }
}

// ========================================
// 9. MEMILIH TITIK DI PETA
// ========================================

function pilihTitik(posisi) {
    if (
        !Array.isArray(posisi) ||
        posisi.length < 2 ||
        !Number.isFinite(posisi[0]) ||
        !Number.isFinite(posisi[1])
    ) {
        console.warn("Koordinat klik peta tidak valid:", posisi);
        tampilkanPesan("Koordinat titik tidak valid.");
        return;
    }

    // Klik pertama memulai pilihan baru.
    // Setelah tujuan dipilih, klik berikutnya juga memulai ulang.
    if (!titikAwal || titikTujuan) {
        hapusLapisanPilihan();

        titikAwal = posisi;
        titikTujuan = null;

        elJarak.textContent = "-";

        gambarTitikAwal();
        perbaruiTitik();

        tampilkanPesan(
            "Titik awal dipilih. Klik peta lagi untuk memilih tujuan."
        );

        return;
    }

    // Klik kedua menentukan titik tujuan.
    titikTujuan = posisi;

    gambarTitikTujuan();
    perbaruiTitik();
    hitungRute();
}

// ========================================
// 10. RESET PILIHAN RUTE
// ========================================

function resetRute() {
    hapusLapisanPilihan();

    titikAwal = null;
    titikTujuan = null;

    elJarak.textContent = "-";

    perbaruiTitik();
    tampilkanTarif();

    tampilkanPesan(
        "Pilih titik awal pada peta."
    );
}

// ========================================
// 11. MEMUAT DATA JALAN GEOJSON
// ========================================

function muatJalan() {
    tampilkanPesan("Memuat data jalan Baleendah...");

    console.log("Mulai memuat ./jalan.geojson");

    try {
        getGeoJSON("./jalan.geojson", (response) => {
            console.log("Respons pemuatan GeoJSON:", response);

            if (!response || !response.data) {
                console.error(
                    "GeoJSON gagal dimuat:",
                    response
                );

                tampilkanPesan(
                    "Data jalan gagal dimuat. Periksa lokasi file dan Console."
                );

                return;
            }

            const geojson = response.data;

            if (
                geojson.type !== "FeatureCollection" ||
                !Array.isArray(geojson.features)
            ) {
                console.error(
                    "Format GeoJSON harus berupa FeatureCollection:",
                    geojson
                );

                tampilkanPesan(
                    "Format jalan.geojson tidak sesuai."
                );

                return;
            }

            if (geojson.features.length === 0) {
                console.error("GeoJSON tidak memiliki fitur.");

                tampilkanPesan(
                    "File GeoJSON berhasil dibaca, tetapi tidak berisi fitur."
                );

                return;
            }

            dataJalan = geojson;

            console.log(
                "Jumlah fitur GeoJSON:",
                dataJalan.features.length
            );

            console.table(
                dataJalan.features.map((fitur, index) => ({
                    index,
                    nama:
                        fitur.properties?.name ||
                        fitur.properties?.nama ||
                        fitur.properties?.highway ||
                        "Tanpa nama",
                    geometri: fitur.geometry?.type,
                    jumlahKoordinat:
                        fitur.geometry?.coordinates?.length ?? 0
                }))
            );

            // Tampilkan semua ruas jalan dengan warna merah
            // untuk memastikan garis benar-benar tergambar.
            try {
                hapusLapisanJalan = addGeoJSON(
                    ID_PETA,
                    dataJalan,
                    {
                        style: {
                            stroke: "#ff0000",
                            strokeWidth: 6,
                            strokeOpacity: 1,
                            fillOpacity: 0,
                            radius: 5
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

                console.log(
                    "Lapisan jalan berhasil ditambahkan ke peta."
                );
            } catch (error) {
                console.error(
                    "Gagal menggambar GeoJSON jalan:",
                    error
                );

                tampilkanPesan(
                    "GeoJSON terbaca, tetapi gagal digambar. Periksa Console."
                );

                return;
            }

            // Sesuaikan area peta dengan data jalan.
            try {
                fitMap(ID_PETA, dataJalan);
            } catch (error) {
                console.error(
                    "Gagal menyesuaikan tampilan peta:",
                    error
                );
            }

            // Aktifkan klik peta untuk memilih titik.
            onMapClick(ID_PETA, (posisi) => {
                console.log("Koordinat yang diklik:", posisi);
                pilihTitik(posisi);
            });

            tampilkanPesan(
                `Data jalan siap (${dataJalan.features.length} fitur). Klik peta untuk memilih titik awal.`
            );
        });
    } catch (error) {
        console.error("Kesalahan saat memuat GeoJSON:", error);

        tampilkanPesan(
            "Terjadi kesalahan saat memuat data jalan. Periksa Console."
        );
    }
}

// ========================================
// 12. EVENT TOMBOL RESET
// ========================================

btnReset.addEventListener("click", resetRute);

// ========================================
// 13. INISIALISASI APLIKASI
// ========================================

perbaruiTitik();
tampilkanTarif();
muatJalan();
