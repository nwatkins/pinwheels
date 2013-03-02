class CreatePinwheels < ActiveRecord::Migration
    def change
        create_table :pinwheels do |t|
            t.string :name
            t.timestamps
        end
    end
end
