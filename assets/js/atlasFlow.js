class AtlasFlow {
    constructor(sliderWrapper, options = {}, callback = null) {
        // Validate input
        if (!sliderWrapper) {
            throw new Error('Slider wrapper is required');
        }

        // Core slider elements
        this.slider = sliderWrapper;
        this.wrapper = this.slider.querySelector('.atlas-slider-wrapper');
        this.slides = Array.from(this.slider.querySelectorAll('.atlas-slider-slide'));
        
        // Validate slides
        if (this.slides.length === 0) {
            throw new Error('No slides found in the slider');
        }

        // State management
        this.currentIndex = 0;
        this.totalSlides = this.slides.length;
        this.isAnimating = false;

        // Callback and options
        this.callback = callback;
        this.options = {
            autoplay: false,
            interval: 3000,
            pagination: true,
            navigation: true,
            animationDuration: 500,
            ...options
        };

        // Bind methods to ensure correct context
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.goToSlide = this.goToSlide.bind(this);

        this.init();
    }

    init() {
        this.createPagination();
        this.bindEvents();

        if (this.options.autoplay) {
            this.startAutoplay();
        }
    }

    createPagination() {
        if (!this.options.pagination) return;

        const paginationContainer = this.slider.querySelector('.atlas-slider-pagination');
        if (!paginationContainer) return;

        // Clear existing pagination
        paginationContainer.innerHTML = '';

        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('atlas-slider-dot');
            
            // Mark first slide as active
            if (index === 0) dot.classList.add('active');
            
            dot.dataset.index = index;
            dot.addEventListener('click', () => this.safeGoToSlide(index));
            paginationContainer.appendChild(dot);
        });
    }

    bindEvents() {
        const prevBtn = this.slider.querySelector('.prev');
        const nextBtn = this.slider.querySelector('.next');

        if (prevBtn) prevBtn.addEventListener('click', this.prev);
        if (nextBtn) nextBtn.addEventListener('click', this.next);
    }

    safeGoToSlide(index) {
        // Prevent interaction during animation
        if (this.isAnimating) return;
        this.goToSlide(index);
    }

    next() {
        // Prevent interaction during animation
        if (this.isAnimating) return;
        this.goToSlide(this.currentIndex + 1, 'next');
    }

    prev() {
        // Prevent interaction during animation
        if (this.isAnimating) return;
        this.goToSlide(this.currentIndex - 1, 'prev');
    }

    async goToSlide(index, dir) {
        // Prevent multiple simultaneous animations
        if (this.isAnimating) return;
        this.isAnimating = true;

        // Normalize index
        index = (index + this.totalSlides) % this.totalSlides;

        // Early return if trying to go to current slide
        if (index === this.currentIndex) {
            this.isAnimating = false;
            return;
        }

        // Determine direction
        const direction = dir 
            ? (dir === 'next' ? 'right' : 'left') 
            : (index > this.currentIndex ? 'right' : 'left');

        try {
            // Prepare next slide
            this.slides[index].classList.add(`next-${direction}`);
            await this.sleep(10);
            this.slides[index].classList.add('ready');
            await this.sleep(10);

            // Trigger reflow
            this.slides[index].offsetWidth;

            // Update pagination
            this.updatePagination(this.currentIndex, false);
            this.updatePagination(index, true);

            // Wait for animation
            await this.sleep(this.options.animationDuration);

            // Clean up classes
            this.slides[this.currentIndex].classList.remove('ready', 'active');
            this.slides[index].classList.remove(`next-${direction}`, 'ready');
            this.slides[index].classList.add('active');

            // Update current index
            this.currentIndex = index;

            // Trigger callback if provided
            if (typeof this.callback === 'function') {
                this.callback({ 
                    activeIndex: index, 
                    direction: direction, 
                    wrapper: this.slider 
                });
            }
        } catch (error) {
            console.error('Slide transition error:', error);
        } finally {
            // Always reset animation state
            this.isAnimating = false;
            this.resetAutoplay();
        }
    }

    // Promisified sleep method
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updatePagination(index, isActive) {
        if (!this.options.pagination) return;
        const dots = this.slider.querySelectorAll('.atlas-slider-dot');
        if (dots[index]) {
            dots[index].classList.toggle('active', isActive);
        }
    }

    startAutoplay() {
        if (!this.options.autoplay) return;
        
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            if (!this.isAnimating) {
                this.next();
            }
        }, this.options.interval);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    resetAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }

    // Optional: Destroy method to clean up event listeners
    destroy() {
        this.stopAutoplay();
        
        // Remove event listeners
        const prevBtn = this.slider.querySelector('.prev');
        const nextBtn = this.slider.querySelector('.next');
        
        if (prevBtn) prevBtn.removeEventListener('click', this.prev);
        if (nextBtn) nextBtn.removeEventListener('click', this.next);
        
        // Remove pagination event listeners
        const dots = this.slider.querySelectorAll('.atlas-slider-dot');
        dots.forEach(dot => {
            dot.removeEventListener('click', this.safeGoToSlide);
        });
    }
}