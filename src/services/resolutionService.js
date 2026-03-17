// resolutionService.js

class ResolutionService {
    constructor() {
        this.resolutions = [];
    }

    // Create a new resolution
    create(resolution) {
        this.resolutions.push(resolution);
        return resolution;
    }

    // Read all resolutions
    read() {
        return this.resolutions;
    }

    // Update a resolution by ID
    update(id, updatedResolution) {
        const index = this.resolutions.findIndex(res => res.id === id);
        if (index === -1) return null;
        this.resolutions[index] = {...this.resolutions[index], ...updatedResolution};
        return this.resolutions[index];
    }

    // Delete a resolution by ID
    delete(id) {
        const index = this.resolutions.findIndex(res => res.id === id);
        if (index === -1) return null;
        return this.resolutions.splice(index, 1)[0];
    }
}

module.exports = new ResolutionService();
