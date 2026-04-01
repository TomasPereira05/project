interface CrudRepository<T> {
    fun findById(id: Int): T? // Find an entity by its ID

    fun findAll(): List<T> // Retrieve all entities

    fun save(entity: T) // Save a new or existing entity (used for editing)

    fun deleteById(id: Int) // Delete an entity by its ID

    fun clear() // Delete all entities
}