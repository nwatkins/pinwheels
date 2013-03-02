class CreatePerks < ActiveRecord::Migration
    def up
        create_table :perks do |t|
            t.integer   :pinwheel_id
            t.string    :name
            t.integer   :limit
            t.boolean   :advanced, :default => false, :null => false
            t.timestamps
        end
    end

    def down
        drop_table :perks
    end
end
