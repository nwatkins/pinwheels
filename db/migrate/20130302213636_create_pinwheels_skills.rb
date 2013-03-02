class CreatePinwheelsSkills < ActiveRecord::Migration
    def up
        create_table :pinwheels_skills do |t|
            t.integer   :pinwheel_id
            t.integer   :skill_id
        end
    end

    def down
        drop_table :pinwheels_skills
    end
end
