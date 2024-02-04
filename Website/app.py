from flask import Flask, render_template, request, jsonify
import easyocr
from gtts import gTTS
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)

# Konfigurasi untuk direktori upload dan output
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
app.config['OUTPUT_FOLDER'] = 'static/output/'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# Mengecek apakah ekstensi file adalah salah satu yang diizinkan
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Rute untuk halaman utama
@app.route('/')
def index():
    return render_template('index.html')

# Rute untuk mengunggah gambar dan memprosesnya
@app.route('/upload', methods=['POST'])
def upload_file():
    # Periksa apakah bagian file ada dalam request yang diterima
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    # Periksa apakah file dipilih
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    # Periksa apakah file memiliki ekstensi yang diizinkan dan simpan
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Lakukan OCR pada gambar yang diunggah
        reader = easyocr.Reader(['en'])  # Anda dapat menambahkan kode bahasa lain jika diperlukan
        results = reader.readtext(filepath)
        extracted_text = ' '.join([result[1] for result in results])
        
        # Konversi teks ke suara
        tts = gTTS(text=extracted_text, lang='en')  # Ubah 'en' dengan kode bahasa lain jika diperlukan
        audio_filename = os.path.splitext(filename)[0] + '.mp3'
        audio_path = os.path.join(app.config['OUTPUT_FOLDER'], audio_filename)
        tts.save(audio_path)
        
        # Hapus file gambar yang diunggah setelah diproses untuk menjaga ruang disk
        os.remove(filepath)
        
        # Kirim respons json dengan teks dan path file audio
        return jsonify({'text': extracted_text, 'audioPath': audio_path})
    else:
        return jsonify({'error': 'File type not allowed'}), 400

# Pastikan folder untuk uploads dan output ada
if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
    app.run(debug=True)
