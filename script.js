const cardContainer = document.getElementById('cardContainer');
    const card = document.getElementById('eyeCard');
    const wireChain = document.getElementById('wireChain');
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    let lastMouse = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0 };

    // Create wire segments that connect fixed top point to card
    function createWireSegments() {
      const segmentCount = 20;
      wireChain.innerHTML = '';
      
      for (let i = 0; i < segmentCount; i++) {
        const segment = document.createElement('div');
        segment.className = 'wire-segment';
        segment.setAttribute('data-index', i);
        wireChain.appendChild(segment);
      }
    }

    // Animate wire segments - connecting FIXED top point to movable card
    function animateWire() {
      const segments = wireChain.querySelectorAll('.wire-segment');
      const cardRect = cardContainer.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardTopY = cardRect.top - 15; // Connect to card attachment point
      
      // FIXED attachment point at top center of screen
      const fixedAttachX = window.innerWidth / 2;
      const fixedAttachY = 36; // Fixed position from top
      
      // Calculate total distance and angle
      const deltaX = cardCenterX - fixedAttachX;
      const deltaY = cardTopY - fixedAttachY;
      const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const segmentDistance = totalDistance / segments.length;
      
      segments.forEach((segment, index) => {
        const progress = index / (segments.length - 1);
        
        // Calculate position along the curve
        const currentX = fixedAttachX + (deltaX * progress);
        const currentY = fixedAttachY + (deltaY * progress);
        
        // Add natural hanging curve (catenary-like)
        const gravity = 0.3;
        const sag = Math.sin(progress * Math.PI) * gravity * (totalDistance / 200);
        const saggedY = currentY + sag;
        
        // Position the segment
        segment.style.left = (currentX - 3) + 'px';
        segment.style.top = saggedY + 'px';
        
        // Calculate rotation for natural look
        const nextProgress = Math.min(1, (index + 1) / (segments.length - 1));
        const nextX = fixedAttachX + (deltaX * nextProgress);
        const nextY = fixedAttachY + (deltaY * nextProgress) + Math.sin(nextProgress * Math.PI) * gravity * (totalDistance / 200);
        
        const segmentAngle = Math.atan2(nextY - saggedY, nextX - currentX);
        segment.style.transform = `rotate(${segmentAngle}rad)`;
        
        // Add physics influence
        const velocityInfluence = velocity.x * 0.005 * (1 - progress);
        const finalRotation = segmentAngle + velocityInfluence;
        segment.style.transform = `rotate(${finalRotation}rad)`;
        
        // Smooth transitions
        segment.style.transition = `all ${0.05 + progress * 0.1}s ease-out`;
      });
    }

    // Initialize wire
    createWireSegments();
    animateWire();

    // Get card dimensions for boundary checking
    function getCardBounds() {
      const rect = cardContainer.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height
      };
    }

    cardContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = cardContainer.getBoundingClientRect();
      offset.x = e.clientX - rect.left;
      offset.y = e.clientY - rect.top;
      lastMouse = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(floatAnim);
      
      cardContainer.style.transition = 'none';
      
      // Disable wire transition during drag for immediate response
      const segments = wireChain.querySelectorAll('.wire-segment');
      segments.forEach(segment => {
        segment.style.transition = 'none';
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;

        velocity.x = dx;
        velocity.y = dy;

        // Calculate new position
        let newLeft = e.clientX - offset.x;
        let newTop = e.clientY - offset.y;

        // Get card bounds
        const bounds = getCardBounds();
        
        // Constrain to screen boundaries (leaving space for top bar)
        newLeft = Math.max(0, Math.min(window.innerWidth - bounds.width, newLeft));
        newTop = Math.max(30, Math.min(window.innerHeight - bounds.height, newTop));

        cardContainer.style.left = newLeft + 'px';
        cardContainer.style.top = newTop + 'px';

        lastMouse = { x: e.clientX, y: e.clientY };
        
        // Animate wire during drag
        animateWire();
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        cardContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Re-enable wire transitions
        const segments = wireChain.querySelectorAll('.wire-segment');
        segments.forEach((segment, index) => {
          const progress = (index + 1) / segments.length;
          segment.style.transition = `transform ${0.1 + progress * 0.1}s ease-out`;
        });
        
        smoothFloat();
      }
    });

    // Smooth floating after release
    let floatAnim;
    function smoothFloat() {
      let decay = 0.94;
      
      function animate() {
        velocity.x *= decay;
        velocity.y *= decay;

        const rect = cardContainer.getBoundingClientRect();
        let newLeft = rect.left + velocity.x;
        let newTop = rect.top + velocity.y;

        // Get card bounds
        const bounds = getCardBounds();
        
        // Constrain to screen boundaries (leaving space for top bar)
        newLeft = Math.max(0, Math.min(window.innerWidth - bounds.width, newLeft));
        newTop = Math.max(30, Math.min(window.innerHeight - bounds.height, newTop));

        cardContainer.style.left = newLeft + 'px';
        cardContainer.style.top = newTop + 'px';

        // Animate wire during momentum
        animateWire();

        if (Math.abs(velocity.x) > 0.5 || Math.abs(velocity.y) > 0.5) {
          floatAnim = requestAnimationFrame(animate);
        }
      }
      animate();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      const rect = cardContainer.getBoundingClientRect();
      const bounds = getCardBounds();
      
      let newLeft = Math.max(0, Math.min(window.innerWidth - bounds.width, rect.left));
      let newTop = Math.max(30, Math.min(window.innerHeight - bounds.height, rect.top));
      
      cardContainer.style.left = newLeft + 'px';
      cardContainer.style.top = newTop + 'px';
      
      animateWire();
    });

    // Subtle continuous wire animation
    setInterval(() => {
      if (!isDragging) {
        animateWire();
      }
    }, 100);