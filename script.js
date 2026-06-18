// Music Player Functionality
class MusicPlayer {
    constructor() {
        this.currentSong = 0;
        this.isPlaying = false;
        this.audio = null; // Start with null to enable demo mode
        this.currentTime = 0;
        this.duration = 0;
        this.demoTimer = null;
        this.useAPI = false; // Start with demo mode enabled
        
        // Jamendo API credentials (for future use)
        this.jamendoClientId = '58630f93';
        this.jamendoClientSecret = '5d6d8628ada6d7412ab950b8596693a5';
        this.jamendoApiBase = 'https://api.jamendo.com/v3.0';
        
        this.songs = [
            {
                title: "Romantic Melody",
                artist: "Love Songs",
                duration: "3:45",
                durationSeconds: 225
            },
            {
                title: "Heart's Symphony",
                artist: "Romantic Collection", 
                duration: "4:12",
                durationSeconds: 252
            },
            {
                title: "Love's Whisper",
                artist: "Soft Melodies",
                duration: "3:28",
                durationSeconds: 208
            },
            {
                title: "Forever Together",
                artist: "Romantic Ballads",
                duration: "5:01",
                durationSeconds: 301
            },
            {
                title: "Eternal Love",
                artist: "Classic Romance",
                duration: "4:30",
                durationSeconds: 270
            }
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.setupAudioEvents();
        this.loadCurrentSong();
    }
    
    setupAudioEvents() {
        if (!this.audio) return;
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateDuration();
        });

        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            this.nextSong();
        });

        this.audio.addEventListener('error', (e) => {
            console.log('Audio error:', e);
            // Fallback to demo mode on API failure
            this.fallbackToDemo();
        });

        // Handle CORS and loading issues
        this.audio.crossOrigin = "anonymous";
    }

    fallbackToDemo() {
        console.log('Falling back to demo mode');
        this.useAPI = false;
        this.audio = null;
        if (this.isPlaying) {
            this.startDemoProgress();
        }
    }
    
    async getJamendoTrackUrl(trackId) {
        try {
            const response = await fetch(`${this.jamendoApiBase}/tracks/?client_id=${this.jamendoClientId}&format=json&id=${trackId}&include=musicinfo`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const track = data.results[0];
                // Use the audio download URL with proper format
                return `${track.audio}?client_id=${this.jamendoClientId}`;
            }
            return null;
        } catch (error) {
            console.log('Jamendo API error:', error);
            return null;
        }
    }

    async loadCurrentSong() {
        if (!this.useAPI || !this.audio) {
            return;
        }
        
        const currentSong = this.songs[this.currentSong];
        if (currentSong && currentSong.url) {
            this.audio.src = currentSong.url;
            this.audio.load();
        }
    }
    
    bindEvents() {
        // Play/Pause button
        const playBtn = document.querySelector('.play-btn');
        playBtn.addEventListener('click', () => this.togglePlay());
        
        // Previous/Next buttons
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        prevBtn.addEventListener('click', () => this.previousSong());
        nextBtn.addEventListener('click', () => this.nextSong());
        
        // Playlist items
        const playlistItems = document.querySelectorAll('.playlist-item');
        playlistItems.forEach((item, index) => {
            item.addEventListener('click', () => this.selectSong(index));
        });
        
        // Progress bar click
        const progressBar = document.querySelector('.progress-bar');
        progressBar.addEventListener('click', (e) => this.seekTo(e));
    }
    
    togglePlay() {
        const playBtn = document.querySelector('.play-btn i');
        
        if (this.isPlaying) {
            this.pause();
            playBtn.className = 'fas fa-play';
        } else {
            this.play();
            playBtn.className = 'fas fa-pause';
        }
    }
    
    play() {
        if (!this.useAPI || !this.audio) {
            // Demo mode
            this.isPlaying = true;
            this.updatePlayButton();
            this.startDemoProgress();
            this.animatePlayButton();
        } else {
            // API mode with better error handling
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    this.updatePlayButton();
                    this.animatePlayButton();
                }).catch(error => {
                    console.log('Audio play failed, switching to demo mode:', error);
                    // Fallback to demo mode
                    this.fallbackToDemo();
                    this.play();
                });
            }
        }
        
        const albumArt = document.querySelector('.album-art');
        if (albumArt) {
            albumArt.style.animationPlayState = 'running';
        }
        
        // Add playing animation to current playlist item
        this.updatePlaylistDisplay();
    }
    
    pause() {
        if (!this.useAPI || !this.audio) {
            // Demo mode
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopDemoProgress();
        } else {
            // API mode
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
        }
        
        const albumArt = document.querySelector('.album-art');
        if (albumArt) {
            albumArt.style.animationPlayState = 'paused';
        }
    }
    
    startDemoProgress() {
        if (this.demoTimer) clearInterval(this.demoTimer);
        
        const currentSong = this.songs[this.currentSong];
        this.duration = currentSong.durationSeconds;
        this.updateDuration();
        
        this.demoTimer = setInterval(() => {
            if (this.isPlaying) {
                this.currentTime += 1;
                this.updateProgress();
                
                if (this.currentTime >= this.duration) {
                    this.nextSong();
                }
            }
        }, 1000);
    }
    
    stopDemoProgress() {
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }
    }
    
    updatePlayButton() {
        const playBtn = document.querySelector('.play-btn i');
        if (playBtn) {
            playBtn.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    animatePlayButton() {
        const albumArt = document.querySelector('.album-art');
        if (albumArt) {
            albumArt.style.animationPlayState = this.isPlaying ? 'running' : 'paused';
        }
    }
    
    nextSong() {
        this.currentSong = (this.currentSong + 1) % this.songs.length;
        this.currentTime = 0;
        this.loadCurrentSong();
        this.updateDisplay();
        if (this.isPlaying) {
            this.play();
        }
    }

    previousSong() {
        this.currentSong = (this.currentSong - 1 + this.songs.length) % this.songs.length;
        this.currentTime = 0;
        this.loadCurrentSong();
        this.updateDisplay();
        if (this.isPlaying) {
            this.play();
        }
    }

    selectSong(index) {
        this.currentSong = index;
        this.currentTime = 0;
        this.loadCurrentSong();
        this.updateDisplay();
        if (this.isPlaying) {
            this.play();
        }
    }
    
    updateDisplay() {
        const song = this.songs[this.currentSong];
        
        // Update song info
        document.querySelector('.song-title').textContent = song.title;
        document.querySelector('.artist-name').textContent = song.artist;
        document.querySelector('.total-time').textContent = song.duration;
        
        // Update playlist display
        this.updatePlaylistDisplay();
    }
    
    updatePlaylistDisplay() {
        const playlistItems = document.querySelectorAll('.playlist-item');
        
        playlistItems.forEach((item, index) => {
            if (index === this.currentSong) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    resetProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const currentTime = document.querySelector('.current-time');
        
        progressFill.style.width = '0%';
        currentTime.textContent = '0:00';
    }
    
    updateProgress() {
        if (this.audio && this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            const progressFill = document.querySelector('.progress-fill');
            progressFill.style.width = `${percent}%`;
            
            // Update current time display
            document.querySelector('.current-time').textContent = this.secondsToTime(Math.floor(this.audio.currentTime));
        }
    }
    
    updateDuration() {
        if (this.audio && this.audio.duration) {
            document.querySelector('.total-time').textContent = this.secondsToTime(Math.floor(this.audio.duration));
        }
    }
    
    seekTo(e) {
        const progressBar = document.querySelector('.progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        
        if (this.audio && this.audio.duration) {
            this.audio.currentTime = this.audio.duration * percent;
        } else {
            // Fallback for demo mode
            const progressFill = document.querySelector('.progress-fill');
            progressFill.style.width = `${percent * 100}%`;
            
            const song = this.songs[this.currentSong];
            const totalSeconds = this.timeToSeconds(song.duration);
            const currentSeconds = Math.floor(totalSeconds * percent);
            
            document.querySelector('.current-time').textContent = this.secondsToTime(currentSeconds);
        }
    }
    
    startProgressAnimation() {
        // Simulate progress for demo purposes
        setInterval(() => {
            if (this.isPlaying) {
                const progressFill = document.querySelector('.progress-fill');
                const currentWidth = parseFloat(progressFill.style.width) || 0;
                
                if (currentWidth < 100) {
                    const newWidth = currentWidth + 0.5;
                    progressFill.style.width = `${newWidth}%`;
                    
                    // Update current time
                    const song = this.songs[this.currentSong];
                    const totalSeconds = this.timeToSeconds(song.duration);
                    const currentSeconds = Math.floor(totalSeconds * (newWidth / 100));
                    
                    document.querySelector('.current-time').textContent = this.secondsToTime(currentSeconds);
                } else {
                    // Song finished, go to next
                    this.nextSong();
                }
            }
        }, 200);
    }
    
    timeToSeconds(timeString) {
        const [minutes, seconds] = timeString.split(':').map(Number);
        return minutes * 60 + seconds;
    }
    
    secondsToTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Gallery Functionality
class Gallery {
    constructor() {
        this.init();
    }
    
    init() {
        this.addGalleryInteractions();
        this.addScrollAnimations();
    }
    
    addGalleryInteractions() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showImageModal(index);
            });
            
            // Add entrance animation delay
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }
    
    showImageModal(index) {
        // Get the actual image source from the gallery
        const galleryItems = document.querySelectorAll('.gallery-item');
        const selectedItem = galleryItems[index];
        const imgElement = selectedItem.querySelector('.gallery-image');
        const imgSrc = imgElement.src;
        const imgAlt = imgElement.alt;
        
        // Create full-screen modal for image viewing
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <span class="close-modal">&times;</span>
                    <div class="modal-nav">
                        <button class="nav-btn prev-btn" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="image-counter">${index + 1} / ${galleryItems.length}</span>
                        <button class="nav-btn next-btn" ${index === galleryItems.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-image-container">
                    <img src="${imgSrc}" alt="${imgAlt}" class="modal-image" />
                    <div class="image-info">
                        <h3>${imgAlt}</h3>
                        <p>A beautiful moment captured in time ♥</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="action-btn fullscreen-btn">
                        <i class="fas fa-expand"></i>
                        <span>Fullscreen</span>
                    </button>
                    <button class="action-btn download-btn">
                        <i class="fas fa-download"></i>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add comprehensive modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            touch-action: none;
        `;
        
        const overlay = modal.querySelector('.modal-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            position: relative;
            width: 95%;
            height: 95%;
            max-width: 1200px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            overflow: hidden;
        `;
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background: rgba(0, 0, 0, 0.3);
            color: white;
        `;
        
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.style.cssText = `
            font-size: 2rem;
            cursor: pointer;
            color: white;
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
        `;
        
        const modalNav = modal.querySelector('.modal-nav');
        modalNav.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
        `;
        
        const navBtns = modal.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.style.cssText = `
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 0.5rem;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            if (btn.disabled) {
                btn.style.opacity = '0.3';
                btn.style.cursor = 'not-allowed';
            }
        });
        
        const imageCounter = modal.querySelector('.image-counter');
        imageCounter.style.cssText = `
            color: white;
            font-weight: 500;
            font-size: 0.9rem;
        `;
        
        const imageContainer = modal.querySelector('.modal-image-container');
        imageContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            position: relative;
        `;
        
        const modalImage = modal.querySelector('.modal-image');
        modalImage.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease;
        `;
        
        const imageInfo = modal.querySelector('.image-info');
        imageInfo.style.cssText = `
            text-align: center;
            color: white;
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            backdrop-filter: blur(10px);
        `;
        
        const modalActions = modal.querySelector('.modal-actions');
        modalActions.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 1rem;
            padding: 1rem 1.5rem;
            background: rgba(0, 0, 0, 0.3);
        `;
        
        const actionBtns = modal.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
                backdrop-filter: blur(10px);
            `;
        });
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Navigation functionality
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        
        if (!prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
                this.showImageModal(index - 1);
            });
        }
        
        if (!nextBtn.disabled) {
            nextBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
                this.showImageModal(index + 1);
            });
        }
        
        // Fullscreen functionality
        const fullscreenBtn = modal.querySelector('.fullscreen-btn');
        fullscreenBtn.addEventListener('click', () => {
            if (modal.requestFullscreen) {
                modal.requestFullscreen();
            } else if (modal.webkitRequestFullscreen) {
                modal.webkitRequestFullscreen();
            } else if (modal.msRequestFullscreen) {
                modal.msRequestFullscreen();
            }
        });
        
        // Download functionality
        const downloadBtn = modal.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = imgSrc;
            link.download = `memory-${index + 1}.jpg`;
            link.click();
        });
        
        // Close modal functionality
        const closeModal = () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                document.body.style.overflow = '';
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Keyboard navigation
        const handleKeyPress = (e) => {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    if (index > 0) {
                        document.body.removeChild(modal);
                        document.body.style.overflow = '';
                        this.showImageModal(index - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (index < galleryItems.length - 1) {
                        document.body.removeChild(modal);
                        document.body.style.overflow = '';
                        this.showImageModal(index + 1);
                    }
                    break;
                case 'f':
                case 'F':
                    fullscreenBtn.click();
                    break;
            }
        };
        
        document.addEventListener('keydown', handleKeyPress);
        
        // Clean up event listener when modal is closed
        const originalCloseModal = closeModal;
        const newCloseModal = () => {
            document.removeEventListener('keydown', handleKeyPress);
            originalCloseModal();
        };
        
        closeBtn.removeEventListener('click', closeModal);
        overlay.removeEventListener('click', closeModal);
        closeBtn.addEventListener('click', newCloseModal);
        overlay.addEventListener('click', newCloseModal);
        
        // Touch gestures for mobile
        let startX = 0;
        let startY = 0;
        
        modalImage.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        modalImage.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Horizontal swipe detection
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0 && index < galleryItems.length - 1) {
                    // Swipe left - next image
                    document.body.removeChild(modal);
                    document.body.style.overflow = '';
                    this.showImageModal(index + 1);
                } else if (diffX < 0 && index > 0) {
                    // Swipe right - previous image
                    document.body.removeChild(modal);
                    document.body.style.overflow = '';
                    this.showImageModal(index - 1);
                }
            }
            // Vertical swipe down to close
            else if (diffY < -100) {
                newCloseModal();
            }
        });
        
        // Add hover effects
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            closeBtn.style.transform = 'scale(1.1)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.transform = 'scale(1)';
        });
        
        navBtns.forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(255, 255, 255, 0.3)';
                    btn.style.transform = 'scale(1.1)';
                });
                
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'rgba(255, 255, 255, 0.2)';
                    btn.style.transform = 'scale(1)';
                });
            }
        });
        
        actionBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.3)';
                btn.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
                btn.style.transform = 'translateY(0)';
            });
        });
    }
    
    addScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
                }
            });
        }, observerOptions);
        
        // Observe all sections
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            observer.observe(section);
        });
    }
}

// Enhanced Heart Animations for Bittu
class HeartAnimations {
    constructor() {
        // Initialize enhanced animations
        this.createFloatingHearts();
        this.createSparkles();
        this.createRosePetals();
        this.animateContentSections();
        this.createSparkleEffects();
        this.initLoveAnimations();
        this.createGalleryAnimations();
    }

    // Enhanced Gallery Animations
    createGalleryAnimations() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach((item, index) => {
            const heartsContainer = item.querySelector('.image-hearts');
            if (heartsContainer) {
                this.createImageHearts(heartsContainer);
            }
            
            // Add hover event listeners for enhanced effects
            item.addEventListener('mouseenter', () => {
                this.triggerImageEffects(item);
            });
            
            item.addEventListener('mouseleave', () => {
                this.resetImageEffects(item);
            });
        });
    }

    createImageHearts(container) {
        const heartSymbols = ['💖', '💕', '💗', '💓', '💝'];
        const heartCount = 6;

        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'image-heart';
            heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
            
            // Random positioning
            heart.style.left = `${Math.random() * 80 + 10}%`;
            heart.style.top = `${Math.random() * 80 + 10}%`;
            heart.style.animationDelay = `${Math.random() * 2}s`;
            
            container.appendChild(heart);
        }
    }

    triggerImageEffects(item) {
        // Add extra sparkle on hover
        item.style.filter = 'brightness(1.1) saturate(1.3)';
    }

    resetImageEffects(item) {
        // Reset effects
        item.style.filter = '';
    }
    createFloatingHearts() {
        const heartsContainer = document.querySelector('.floating-hearts');
        if (!heartsContainer) return;

        // Clear existing hearts
        heartsContainer.innerHTML = '';
        
        // Create multiple hearts with different positions and delays
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '💖';
            
            // Random horizontal position
            heart.style.left = Math.random() * 100 + '%';
            
            // Random animation delay
            heart.style.animationDelay = Math.random() * 8 + 's';
            
            // Random heart symbols
            const heartSymbols = ['💖', '💕', '💗', '💓', '💝', '❤️', '💜', '🧡'];
            heart.innerHTML = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
            
            heartsContainer.appendChild(heart);
        }
        
        // Create continuous floating hearts
        setInterval(() => {
            this.addFloatingHeart(heartsContainer);
        }, 2000);
    }
    
    createSparkles() {
        const sparklesContainer = document.querySelector('.sparkles');
        if (!sparklesContainer) return;
        
        // Clear existing sparkles
        sparklesContainer.innerHTML = '';
        
        // Create sparkles
        for (let i = 0; i < 25; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            // Random position
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            
            // Random animation delay
            sparkle.style.animationDelay = Math.random() * 3 + 's';
            
            sparklesContainer.appendChild(sparkle);
        }
    }
    
    createRosePetals() {
        const petalsContainer = document.querySelector('.rose-petals');
        if (!petalsContainer) return;
        
        // Clear existing petals
        petalsContainer.innerHTML = '';
        
        // Create rose petals
        for (let i = 0; i < 12; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            
            // Random horizontal position
            petal.style.left = Math.random() * 100 + '%';
            
            // Random animation delay
            petal.style.animationDelay = Math.random() * 12 + 's';
            
            petalsContainer.appendChild(petal);
        }
    }
    
    // Enhanced content animations
    animateContentSections() {
        const sections = document.querySelectorAll('.hero, .gallery, .music-player');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'all 0.8s ease-out';
            observer.observe(section);
        });
    }

    addFloatingHeart(container) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = ['💖', '💕', '💗', '💝', '💘'][Math.floor(Math.random() * 5)];
        
        // Random position
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (Math.random() * 3 + 5) + 's';
        heart.style.fontSize = (Math.random() * 10 + 15) + 'px';
        
        container.appendChild(heart);
        
        // Remove after animation
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 8000);
    }

    createSparkleEffects() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.addSparkles(item);
            });
        });
    }

    addSparkles(element) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.top = Math.random() * 100 + '%';
                
                element.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 2000);
            }, i * 200);
        }
    }

    initLoveAnimations() {
        // Add romantic glow to hero section on scroll
        window.addEventListener('scroll', () => {
            const heroSection = document.querySelector('.hero-section');
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (heroSection) {
                heroSection.style.transform = `translateY(${rate}px)`;
            }
        });

        // Animate gallery items on intersection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        });

        document.querySelectorAll('.gallery-item').forEach(item => {
            observer.observe(item);
        });
    }
}

// Smooth Scrolling
function addSmoothScrolling() {
    // Add smooth scrolling to any anchor links if they exist
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add CSS animations for modal and click hearts
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes clickHeart {
            0% {
                transform: scale(0) translateY(0);
                opacity: 1;
            }
            50% {
                transform: scale(1.2) translateY(-20px);
                opacity: 0.8;
            }
            100% {
                transform: scale(0.8) translateY(-40px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Interactive Gift Box Class
class InteractiveGift {
    constructor() {
        this.giftBox = document.getElementById('giftBox');
        this.emojiContainer = document.getElementById('giftEmoji');
        this.loveMessage = document.getElementById('loveMessage');
        this.isOpened = false;
        this.cuteEmojis = ['🥰', '😍', '🤗', '😘', '💕', '🌹', '🦋', '🌟', '💖', '🎈'];
        
        this.init();
    }
    
    init() {
        if (this.giftBox) {
            this.giftBox.addEventListener('click', () => this.openGift());
        }
    }
    
    openGift() {
        if (this.isOpened) return;
        
        this.isOpened = true;
        
        // Step 1: Open gift box animation
        this.giftBox.classList.add('opening');
        
        setTimeout(() => {
            this.giftBox.classList.remove('opening');
            this.giftBox.classList.add('opened');
            
            // Step 2: Show cute emoji
            this.showCuteEmoji();
        }, 500);
        
        setTimeout(() => {
            // Step 3: Show love message
            this.showLoveMessage();
        }, 1500);
        
        setTimeout(() => {
            // Step 4: Hide everything and reset
            this.hideAndReset();
        }, 6000);
    }
    
    showCuteEmoji() {
        const randomEmoji = this.cuteEmojis[Math.floor(Math.random() * this.cuteEmojis.length)];
        this.emojiContainer.textContent = randomEmoji;
        this.emojiContainer.classList.add('show');
        
        // Add sound effect simulation (visual feedback)
        this.createSoundEffect();
    }
    
    createSoundEffect() {
        // Create visual sound effect with sparkles
        const soundEffect = document.createElement('div');
        soundEffect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2001;
            pointer-events: none;
            font-size: 30px;
            animation: soundWave 1s ease-out forwards;
        `;
        soundEffect.textContent = '🎵✨🎶';
        document.body.appendChild(soundEffect);
        
        setTimeout(() => {
            document.body.removeChild(soundEffect);
        }, 1000);
    }
    
    showLoveMessage() {
        this.loveMessage.classList.add('show');
    }
    
    hideAndReset() {
        // Hide emoji and message
        this.emojiContainer.classList.add('hide');
        this.loveMessage.classList.add('hide');
        
        setTimeout(() => {
            // Reset everything
            this.emojiContainer.classList.remove('show', 'hide');
            this.loveMessage.classList.remove('show', 'hide');
            this.giftBox.classList.remove('opened');
            this.emojiContainer.textContent = '';
            this.isOpened = false;
        }, 1000);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addDynamicStyles();
    
    const musicPlayer = new MusicPlayer();
    const gallery = new Gallery();
    const heartAnimations = new HeartAnimations();
    const interactiveGift = new InteractiveGift();
    
    addSmoothScrolling();
    
    // Add a welcome animation
    setTimeout(() => {
        document.body.style.animation = 'fadeIn 1s ease';
    }, 100);
    
    console.log('Bitu\'s page loaded with love ♥');
});